use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use axum_extra::extract::cookie::PrivateCookieJar;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::{auth, state::AppState};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketFileBody {
    pub id: Option<i32>,
    pub ticket_id: Option<Uuid>,
    pub content: Option<Vec<u8>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketRequestBody {
    pub submitter_id: Uuid,
    pub environment: i32,
    pub title: String,
    pub description: String,
    pub steps_to_reproduce: String,
    pub expected_result: String,
    pub files: Vec<TicketFileBody>,
    pub is_resolved: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserTicketAssignDto {
    pub user_id: Uuid,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketResponse {
    pub ticket_id: Uuid,
    pub title: String,
    pub description: String,
    pub steps_to_reproduce: String,
    pub expected_result: String,
    pub environment: String,
    pub submitter_id: Uuid,
    pub assignee_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub is_resolved: bool,
}

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Ticket {
    #[sqlx(rename = "TicketId")]
    pub ticket_id: Uuid,
    #[sqlx(rename = "SubmitterId")]
    pub submitter_id: Uuid,
    #[sqlx(rename = "AssigneeId")]
    pub assignee_id: Option<Uuid>,
    #[sqlx(rename = "Environment")]
    pub environment: i32,
    #[sqlx(rename = "Title")]
    pub title: String,
    #[sqlx(rename = "Description")]
    pub description: String,
    #[sqlx(rename = "StepsToReproduce")]
    pub steps_to_reproduce: String,
    #[sqlx(rename = "ExpectedResult")]
    pub expected_result: String,
    #[sqlx(rename = "IsResolved")]
    pub is_resolved: bool,
    #[sqlx(rename = "CreatedAt")]
    pub created_at: DateTime<Utc>,
    #[sqlx(rename = "UpdatedAt")]
    pub updated_at: DateTime<Utc>,
    #[sqlx(rename = "DeletedAt")]
    pub deleted_at: Option<DateTime<Utc>>,
    #[sqlx(rename = "IsDeleted")]
    pub is_deleted: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketsQuery {
    pub submitter_id: Option<Uuid>,
}

fn env_to_string(e: i32) -> String {
    match e {
        0 => "Browser",
        1 => "Device",
        2 => "OperatingSystem",
        _ => "Unknown",
    }
    .to_string()
}

pub async fn hello() -> impl IntoResponse {
    "Hello from TicketController Rust!"
}

pub async fn get_ticket_by_id(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path(ticket_id): Path<Uuid>,
) -> impl IntoResponse {
    let (viewer_id, role) = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };
    let is_admin = role.eq_ignore_ascii_case("Admin");

    let ticket = match sqlx::query_as::<_, Ticket>(
        "SELECT \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\" \
         FROM \"Tickets\" \
         WHERE \"TicketId\" = $1 \
         LIMIT 1",
    )
    .bind(ticket_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
    {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    let Some(ticket) = ticket else { return StatusCode::NOT_FOUND.into_response() };

    if !is_admin && ticket.submitter_id != viewer_id && ticket.assignee_id != Some(viewer_id) {
        return StatusCode::FORBIDDEN.into_response();
    }

    Json(ticket).into_response()
}

pub async fn list_tickets(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Query(q): Query<TicketsQuery>,
) -> impl IntoResponse {
    let (viewer_id, role) = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };
    let is_admin = role.eq_ignore_ascii_case("Admin");

    let res = if is_admin {
        if let Some(submitter_id) = q.submitter_id.filter(|id| *id != Uuid::nil()) {
            sqlx::query_as::<_, Ticket>(
                "SELECT \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\" \
                 FROM \"Tickets\" \
                 WHERE \"SubmitterId\" = $1 \
                 ORDER BY \"CreatedAt\" DESC",
            )
            .bind(submitter_id)
            .fetch_all(&state.db)
            .await
        } else {
            sqlx::query_as::<_, Ticket>(
                "SELECT \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\" \
                 FROM \"Tickets\" \
                 ORDER BY \"CreatedAt\" DESC",
            )
            .fetch_all(&state.db)
            .await
        }
    } else {
        sqlx::query_as::<_, Ticket>(
            "SELECT \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\" \
             FROM \"Tickets\" \
             WHERE \"SubmitterId\" = $1 OR \"AssigneeId\" = $1 \
             ORDER BY \"CreatedAt\" DESC",
        )
        .bind(viewer_id)
        .fetch_all(&state.db)
        .await
    };

    match res {
        Ok(tickets) => Json(tickets).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn create_ticket(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<TicketRequestBody>,
) -> impl IntoResponse {
    let _ = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    if body.submitter_id == Uuid::nil() {
        return (StatusCode::BAD_REQUEST, "Submitter ID is required").into_response();
    }
    if body.title.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, "Title is required").into_response();
    }

    let user_exists = match sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM \"ApplicationUsers\" WHERE \"Id\" = $1")
        .bind(body.submitter_id)
        .fetch_one(&state.db)
        .await
    {
        Ok(v) => v > 0,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    if !user_exists {
        return StatusCode::BAD_REQUEST.into_response();
    }

    let now = Utc::now();
    let ticket_id = Uuid::new_v4();

    let created = match sqlx::query_as::<_, Ticket>(
        "INSERT INTO \"Tickets\" \
         (\"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", \"DeletedAt\", \"IsDeleted\") \
         VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,$8,$9,$10,'-infinity'::timestamptz,$11) \
         RETURNING \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\"",
    )
    .bind(ticket_id)
    .bind(body.submitter_id)
    .bind(body.environment)
    .bind(body.title)
    .bind(body.description)
    .bind(body.steps_to_reproduce)
    .bind(body.expected_result)
    .bind(false)
    .bind(now)
    .bind(now)
    .bind(false)
    .fetch_one(&state.db)
    .await
    {
        Ok(t) => t,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };

    let response = TicketResponse {
        ticket_id: created.ticket_id,
        title: created.title,
        description: created.description,
        steps_to_reproduce: created.steps_to_reproduce,
        expected_result: created.expected_result,
        environment: env_to_string(created.environment),
        submitter_id: created.submitter_id,
        assignee_id: Uuid::nil(),
        created_at: created.created_at,
        is_resolved: created.is_resolved,
    };

    Json(response).into_response()
}

pub async fn update_ticket(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path(ticket_id): Path<Uuid>,
    Json(body): Json<TicketRequestBody>,
) -> impl IntoResponse {
    let _ = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    if body.submitter_id == Uuid::nil() {
        return (StatusCode::BAD_REQUEST, "Submitter ID is required").into_response();
    }
    if body.title.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, "Title is required").into_response();
    }

    let existing = match sqlx::query_as::<_, Ticket>(
        "SELECT \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\" \
         FROM \"Tickets\" WHERE \"TicketId\" = $1 LIMIT 1",
    )
    .bind(ticket_id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(v) => v,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    if existing.is_none() {
        return StatusCode::NOT_FOUND.into_response();
    }

    let now = Utc::now();
    let updated = match sqlx::query_as::<_, Ticket>(
        "UPDATE \"Tickets\" SET \
         \"SubmitterId\" = $2, \"AssigneeId\" = NULL, \"Environment\" = $3, \"Title\" = $4, \"Description\" = $5, \"StepsToReproduce\" = $6, \"ExpectedResult\" = $7, \"IsResolved\" = false, \"CreatedAt\" = $8, \"UpdatedAt\" = $9, \"DeletedAt\" = '-infinity'::timestamptz, \"IsDeleted\" = false \
         WHERE \"TicketId\" = $1 \
         RETURNING \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\"",
    )
    .bind(ticket_id)
    .bind(body.submitter_id)
    .bind(body.environment)
    .bind(body.title)
    .bind(body.description)
    .bind(body.steps_to_reproduce)
    .bind(body.expected_result)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await
    {
        Ok(v) => v,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };

    Json(TicketResponse {
        ticket_id: updated.ticket_id,
        title: updated.title,
        description: updated.description,
        steps_to_reproduce: updated.steps_to_reproduce,
        expected_result: updated.expected_result,
        environment: env_to_string(updated.environment),
        submitter_id: updated.submitter_id,
        assignee_id: Uuid::nil(),
        created_at: updated.created_at,
        is_resolved: updated.is_resolved,
    })
    .into_response()
}

pub async fn delete_ticket(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path(ticket_id): Path<Uuid>,
) -> impl IntoResponse {
    let _ = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    let deleted = sqlx::query_as::<_, Ticket>(
        "DELETE FROM \"Tickets\" WHERE \"TicketId\" = $1 \
         RETURNING \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\"",
    )
    .bind(ticket_id)
    .fetch_optional(&state.db)
    .await;

    match deleted {
        Ok(Some(_)) => StatusCode::NO_CONTENT.into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn assign_ticket_to_user(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path(ticket_id): Path<Uuid>,
    Json(body): Json<UserTicketAssignDto>,
) -> impl IntoResponse {
    let _ = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    if body.user_id == Uuid::nil() {
        return StatusCode::BAD_REQUEST.into_response();
    }

    let user_exists = match sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM \"ApplicationUsers\" WHERE \"Id\" = $1")
        .bind(body.user_id)
        .fetch_one(&state.db)
        .await
    {
        Ok(v) => v > 0,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    if !user_exists {
        return StatusCode::BAD_REQUEST.into_response();
    }

    let now = Utc::now();
    let updated = sqlx::query_as::<_, Ticket>(
        "UPDATE \"Tickets\" SET \"AssigneeId\" = $2, \"UpdatedAt\" = $3 WHERE \"TicketId\" = $1 \
         RETURNING \"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", NULLIF(\"DeletedAt\", '-infinity'::timestamptz) AS \"DeletedAt\", \"IsDeleted\"",
    )
    .bind(ticket_id)
    .bind(body.user_id)
    .bind(now)
    .fetch_optional(&state.db)
    .await;

    match updated {
        Ok(Some(t)) => Json(TicketResponse {
            ticket_id: t.ticket_id,
            title: t.title,
            description: t.description,
            steps_to_reproduce: t.steps_to_reproduce,
            expected_result: t.expected_result,
            environment: env_to_string(t.environment),
            submitter_id: t.submitter_id,
            assignee_id: Uuid::nil(),
            created_at: t.created_at,
            is_resolved: t.is_resolved,
        })
        .into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

#[cfg(feature = "qa")]
pub async fn seed_tickets(state: &AppState) -> Result<(), StatusCode> {
    let any = sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM \"Tickets\"")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if any > 0 {
        return Ok(());
    }

    let user_ids: Vec<(Uuid, String)> = sqlx::query_as::<_, (Uuid, String)>(
        "SELECT \"Id\", COALESCE(\"Role\", '') FROM \"ApplicationUsers\"",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut admin_id = None;
    let mut doctor_id = None;
    let mut nurse_id = None;
    let mut user_id = None;
    for (id, role) in user_ids {
        match role.to_lowercase().as_str() {
            "admin" => admin_id = Some(id),
            "doctor" => doctor_id = Some(id),
            "nurse" => nurse_id = Some(id),
            "user" => user_id = Some(id),
            _ => {}
        }
    }

    let now = Utc::now();
    let admin_id = admin_id.ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let doctor_id = doctor_id.ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let nurse_id = nurse_id.ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let user_id = user_id.ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    let rows = vec![
        (
            Uuid::new_v4(),
            user_id,
            Some(admin_id),
            0,
            "Login page CORS error",
            "Browser blocks request due to missing CORS headers.",
            "Open app and submit login form.",
            "Login succeeds and navigates to dashboard.",
        ),
        (
            Uuid::new_v4(),
            nurse_id,
            Some(doctor_id),
            2,
            "Patient ticket workflow mock",
            "Seeded ticket representing a clinician workflow item.",
            "Open clinician dashboard and click a row.",
            "Modal opens and View Details redirects.",
        ),
    ];

    for (tid, submitter_id, assignee_id, env, title, desc, steps, expected) in rows {
        sqlx::query(
            "INSERT INTO \"Tickets\" \
             (\"TicketId\", \"SubmitterId\", \"AssigneeId\", \"Environment\", \"Title\", \"Description\", \"StepsToReproduce\", \"ExpectedResult\", \"IsResolved\", \"CreatedAt\", \"UpdatedAt\", \"DeletedAt\", \"IsDeleted\") \
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,$9,$10,$11,false)",
        )
        .bind(tid)
        .bind(submitter_id)
        .bind(assignee_id)
        .bind(env)
        .bind(title)
        .bind(desc)
        .bind(steps)
        .bind(expected)
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    Ok(())
}
