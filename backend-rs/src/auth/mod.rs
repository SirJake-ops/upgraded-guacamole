use axum::{
    extract::{State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use axum_extra::extract::cookie::{Cookie, PrivateCookieJar, SameSite};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::state::AppState;


#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub user_name: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationUserDto {
    pub id: Uuid,
    pub user_name: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionCookieV1 {
    session_id: Uuid,
}

#[derive(Debug, FromRow)]
struct UserRow {
    #[sqlx(rename = "Id")]
    id: Uuid,
    #[sqlx(rename = "UserName")]
    user_name: String,
    #[sqlx(rename = "Email")]
    email: String,
    #[sqlx(rename = "Password")]
    password: String,
    #[sqlx(rename = "Role")]
    role: Option<String>,
}

fn session_cookie_name() -> &'static str {
    "bt_session"
}

fn set_session_cookie(jar: PrivateCookieJar, session_id: Uuid) -> Result<PrivateCookieJar, StatusCode> {
    let value =
        serde_json::to_string(&SessionCookieV1 { session_id }).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let cookie = Cookie::build((session_cookie_name(), value))
        .http_only(true)
        .same_site(SameSite::Lax)
        .path("/")
        .max_age(time::Duration::hours(2))
        .build();
    Ok(jar.add(cookie))
}

fn clear_session_cookie(jar: PrivateCookieJar) -> PrivateCookieJar {
    let cookie = Cookie::build((session_cookie_name(), ""))
        .http_only(true)
        .same_site(SameSite::Lax)
        .path("/")
        .max_age(time::Duration::seconds(0))
        .build();
    jar.remove(cookie)
}

fn read_session(jar: &PrivateCookieJar) -> Result<SessionCookie, StatusCode> {
    let cookie = jar.get(session_cookie_name()).ok_or(StatusCode::UNAUTHORIZED)?;
    serde_json::from_str(cookie.value()).map_err(|_| StatusCode::UNAUTHORIZED)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionCookie {
    session_id: Uuid,
}

async fn load_user_by_id(state: &AppState, id: Uuid) -> Result<UserRow, StatusCode> {
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT \"Id\", \"UserName\", \"Email\", \"Password\", \"Role\" \
         FROM \"ApplicationUsers\" \
         WHERE \"Id\" = $1 \
         LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    user.ok_or(StatusCode::UNAUTHORIZED)
}

async fn load_user_by_identifier(state: &AppState, ident: &str) -> Result<UserRow, StatusCode> {
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT \"Id\", \"UserName\", \"Email\", \"Password\", \"Role\" \
         FROM \"ApplicationUsers\" \
         WHERE \"UserName\" = $1 OR \"Email\" = $1 \
         LIMIT 1",
    )
    .bind(ident)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    user.ok_or(StatusCode::UNAUTHORIZED)
}

#[derive(Debug, FromRow)]
struct SessionRow {
    #[sqlx(rename = "SessionId")]
    session_id: Uuid,
    #[sqlx(rename = "UserId")]
    user_id: Uuid,
    #[sqlx(rename = "CreatedAt")]
    created_at: DateTime<Utc>,
    #[sqlx(rename = "LastSeenAt")]
    last_seen_at: DateTime<Utc>,
    #[sqlx(rename = "ExpiresAt")]
    expires_at: DateTime<Utc>,
    #[sqlx(rename = "RevokedAt")]
    revoked_at: Option<DateTime<Utc>>,
}

fn absolute_ttl_hours() -> i64 {
    std::env::var("SESSION_ABSOLUTE_HOURS")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .filter(|v| *v > 0 && *v <= 168)
        .unwrap_or(2)
}

fn idle_ttl_minutes() -> i64 {
    std::env::var("SESSION_IDLE_MINUTES")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .filter(|v| *v > 0 && *v <= 24 * 60)
        .unwrap_or(30)
}

async fn create_session(state: &AppState, user_id: Uuid) -> Result<Uuid, StatusCode> {
    let now = Utc::now();
    let session_id = Uuid::new_v4();
    let expires_at = now + Duration::hours(absolute_ttl_hours());

    sqlx::query(
        "INSERT INTO \"UserSessions\" (\"SessionId\", \"UserId\", \"CreatedAt\", \"LastSeenAt\", \"ExpiresAt\", \"RevokedAt\") \
         VALUES ($1,$2,$3,$4,$5,NULL)",
    )
    .bind(session_id)
    .bind(user_id)
    .bind(now)
    .bind(now)
    .bind(expires_at)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(session_id)
}

async fn revoke_session(state: &AppState, session_id: Uuid) -> Result<(), StatusCode> {
    let now = Utc::now();
    sqlx::query("UPDATE \"UserSessions\" SET \"RevokedAt\" = $2 WHERE \"SessionId\" = $1")
        .bind(session_id)
        .bind(now)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(())
}

async fn require_session_row(state: &AppState, session_id: Uuid) -> Result<SessionRow, StatusCode> {
    let row = sqlx::query_as::<_, SessionRow>(
         FROM \"UserSessions\" \
         WHERE \"SessionId\" = $1 \
         LIMIT 1",
    )
    .bind(session_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let Some(row) = row else { return Err(StatusCode::UNAUTHORIZED) };

    let now = Utc::now();
    if row.revoked_at.is_some() {
        return Err(StatusCode::UNAUTHORIZED);
    }
    if now >= row.expires_at {
        return Err(StatusCode::UNAUTHORIZED);
    }
    if now - row.last_seen_at >= Duration::minutes(idle_ttl_minutes()) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(row)
}

async fn touch_session(state: &AppState, session_id: Uuid) -> Result<(), StatusCode> {
    let now = Utc::now();
    sqlx::query("UPDATE \"UserSessions\" SET \"LastSeenAt\" = $2 WHERE \"SessionId\" = $1")
        .bind(session_id)
        .bind(now)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(())
}

pub async fn current_user(State(state): State<AppState>, jar: PrivateCookieJar) -> impl IntoResponse {
    let session = match read_session(&jar) {
        Ok(s) => s,
        Err(code) => return code.into_response(),
    };

    let session_row = match require_session_row(&state, session.session_id).await {
        Ok(s) => s,
        Err(_) => return (clear_session_cookie(jar), StatusCode::UNAUTHORIZED).into_response(),
    };
    let _ = touch_session(&state, session_row.session_id).await;

    let user = match load_user_by_id(&state, session_row.user_id).await {
        Ok(u) => u,
        Err(code) => return code.into_response(),
    };

    Json(ApplicationUserDto {
        id: user.id,
        user_name: Some(user.user_name),
        email: Some(user.email),
        role: user.role,
    })
    .into_response()
}

pub async fn login(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    let ident = (req.user_name.unwrap_or_default()).trim().to_string();
    if ident.is_empty() {
        return (StatusCode::UNAUTHORIZED, "Username or email is required.").into_response();
    }
    let password = match req.password {
        Some(p) if !p.is_empty() => p,
        _ => return (StatusCode::UNAUTHORIZED, "Password is required.").into_response(),
    };

    let user = match load_user_by_identifier(&state, &ident).await {
        Ok(u) => u,
        Err(_) => return (StatusCode::UNAUTHORIZED, "Invalid username/email.").into_response(),
    };

    if !identity_password::verify(&password, &user.password) {
        return (StatusCode::UNAUTHORIZED, "Invalid password.").into_response();
    }

    let session_id = match create_session(&state, user.id).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };
    let jar = match set_session_cookie(jar, session_id) {
        Ok(j) => j,
        Err(code) => return code.into_response(),
    };

    (
        jar,
        Json(ApplicationUserDto {
            id: user.id,
            user_name: Some(user.user_name),
            email: Some(user.email),
            role: user.role,
        }),
    )
        .into_response()
}

pub async fn logout(State(state): State<AppState>, jar: PrivateCookieJar) -> impl IntoResponse {
    if let Ok(s) = read_session(&jar) {
        let _ = revoke_session(&state, s.session_id).await;
    }
    (clear_session_cookie(jar), StatusCode::OK).into_response()
}

pub async fn require_session(state: &AppState, jar: &PrivateCookieJar) -> Result<(Uuid, String), StatusCode> {
    let cookie = read_session(jar)?;
    let session = require_session_row(state, cookie.session_id).await?;
    let _ = touch_session(state, session.session_id).await;
    let user = load_user_by_id(state, session.user_id).await?;
    Ok((user.id, user.role.unwrap_or_else(|| "User".to_string())))
}

#[cfg(feature = "qa")]
pub async fn seed_users(state: &AppState) -> Result<(), StatusCode> {
    let any = sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM \"ApplicationUsers\"")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if any > 0 {
        return Ok(());
    }

    let now = Utc::now();

    let users = [
        ("admin", "admin@demo.local", "Admin"),
        ("doctor", "doctor@demo.local", "Doctor"),
        ("nurse", "nurse@demo.local", "Nurse"),
        ("user", "user@demo.local", "User"),
    ];

    for (username, email, role) in users {
        let id = Uuid::new_v4();
        let pw = identity_password::hash_v3("Password123!", 10000);
        sqlx::query(
            "INSERT INTO \"ApplicationUsers\" \
             (\"Id\", \"UserName\", \"Email\", \"Password\", \"Role\", \"Token\", \"RefreshToken\", \"RefreshTokenExpiryTime\", \"LastLoginTime\", \"IsOnline\", \"CreatedAt\", \"UpdatedAt\", \"DeletedAt\", \"IsDeleted\") \
             VALUES ($1,$2,$3,$4,$5,NULL,NULL,'-infinity'::timestamptz,'-infinity'::timestamptz,$6,$7,$8,'-infinity'::timestamptz,$9)",
        )
        .bind(id)
        .bind(username)
        .bind(email)
        .bind(pw)
        .bind(role)
        .bind(false)
        .bind(now)
        .bind(now)
        .bind(false)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    Ok(())
}
