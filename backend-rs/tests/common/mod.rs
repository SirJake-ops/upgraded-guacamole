use axum_extra::extract::cookie::Key;
use chrono::{DateTime, Utc};
use sqlx::{Connection, Executor};
use uuid::Uuid;

pub struct TestDb {
    database_url: String,
    schema: String,
}

impl Drop for TestDb {
    fn drop(&mut self) {
        let Ok(handle) = tokio::runtime::Handle::try_current() else {
            return;
        };

        let database_url = self.database_url.clone();
        let schema = self.schema.clone();
        handle.spawn(async move {
            if let Ok(mut conn) = sqlx::PgConnection::connect(&database_url).await {
                let _ = sqlx::query(&format!("DROP SCHEMA IF EXISTS \"{schema}\" CASCADE"))
                    .execute(&mut conn)
                    .await;
            }
        });
    }
}

pub async fn test_database_url() -> String {
    if let Ok(url) = std::env::var("DATABASE_URL_TEST") {
        return url;
    }
    // Leverage the same .env loading logic as the app.
    backend_rs::config::load()
        .expect("config::load() failed; set DATABASE_URL_TEST (or POSTGRES_* env vars) for tests")
        .database_url
}

pub async fn setup_db() -> (sqlx::PgPool, TestDb) {
    let database_url = test_database_url().await;
    let schema = format!("test_{}", Uuid::new_v4().simple());

    let mut admin = sqlx::PgConnection::connect(&database_url)
        .await
        .expect("connect admin");
    admin
        .execute(&*format!("CREATE SCHEMA \"{schema}\""))
        .await
        .expect("create schema");

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .after_connect({
            let schema = schema.clone();
            move |conn, _meta| {
                let schema = schema.clone();
                Box::pin(async move {
                    conn.execute(&*format!("SET search_path TO \"{schema}\""))
                        .await?;
                    Ok(())
                })
            }
        })
        .connect(&database_url)
        .await
        .expect("connect pool");

    // Run migrations into the per-test schema (via search_path).
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrate");

    (
        pool,
        TestDb {
            database_url,
            schema,
        },
    )
}

pub fn test_cookie_key() -> Key {
    // Deterministic but non-zero.
    let mut k = [0u8; 64];
    for (i, b) in k.iter_mut().enumerate() {
        *b = (i as u8).wrapping_mul(31).wrapping_add(7);
    }
    Key::from(&k)
}

pub async fn seed_user(
    pool: &sqlx::PgPool,
    username: &str,
    email: &str,
    role: &str,
    plain_password: &str,
) -> Uuid {
    let id = Uuid::new_v4();
    let now: DateTime<Utc> = Utc::now();
    let hashed = backend_rs::auth::identity_password::hash_v3(plain_password, 10_000);

    sqlx::query(
        "INSERT INTO \"ApplicationUsers\" \
         (\"Id\", \"UserName\", \"Email\", \"Password\", \"Role\", \"Token\", \"RefreshToken\", \"RefreshTokenExpiryTime\", \"LastLoginTime\", \"IsOnline\", \"CreatedAt\", \"UpdatedAt\", \"DeletedAt\", \"IsDeleted\") \
         VALUES ($1,$2,$3,$4,$5,NULL,NULL,'-infinity'::timestamptz,'-infinity'::timestamptz,$6,$7,$8,'-infinity'::timestamptz,$9)",
    )
    .bind(id)
    .bind(username)
    .bind(email)
    .bind(hashed)
    .bind(role)
    .bind(false)
    .bind(now)
    .bind(now)
    .bind(false)
    .execute(pool)
    .await
    .expect("seed user");

    id
}

pub fn app_state(pool: sqlx::PgPool) -> backend_rs::state::AppState {
    let (chat_tx, _) = tokio::sync::broadcast::channel(16);
    backend_rs::state::AppState {
        db: pool,
        cookie_key: test_cookie_key(),
        chat_tx,
    }
}

pub fn extract_cookie_kv(set_cookie: &str) -> String {
    // "name=value; Path=/; HttpOnly; ..."
    set_cookie
        .split(';')
        .next()
        .unwrap_or_default()
        .trim()
        .to_string()
}
