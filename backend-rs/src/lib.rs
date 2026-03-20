pub mod auth;
pub mod chat;
pub mod config;
pub mod state;
pub mod tickets;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

/// Base API router, without middleware layers (CORS/trace).
///
/// `main.rs` can attach layers for production, and tests can use this directly.
pub fn base_router(state: AppState) -> Router {
    Router::new()
        .route("/api/auth/user", get(auth::current_user))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/logout", post(auth::logout))
        .route("/api/tickets", get(tickets::list_tickets).post(tickets::create_ticket))
        .route("/api/tickets/hello", get(tickets::hello))
        .route("/ws/chat", get(chat::ws_chat))
        .route(
            "/api/tickets/:ticket_id/messages",
            get(tickets::messages::list_messages).post(tickets::messages::create_message),
        )
        .route(
            "/api/tickets/:ticket_id",
            get(tickets::get_ticket_by_id)
                .put(tickets::update_ticket)
                .delete(tickets::delete_ticket)
                .post(tickets::assign_ticket_to_user),
        )
        .with_state(state)
}

/// Builds the shared app state (db pool, cookie key, chat broadcast channel) and runs migrations.
pub async fn build_state(cfg: &config::Config) -> Result<AppState, String> {
    use axum_extra::extract::cookie::Key;
    use sqlx::postgres::PgPoolOptions;

    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&cfg.database_url)
        .await
        .map_err(|e| format!("DB connect failed: {e}"))?;

    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .map_err(|e| format!("DB migrate failed: {e}"))?;

    let key = Key::from(&cfg.cookie_key);
    let (chat_tx, _) = tokio::sync::broadcast::channel(256);
    let state = AppState {
        db,
        cookie_key: key,
        chat_tx,
    };

    #[cfg(feature = "qa")]
    {
        auth::seed_users(&state)
            .await
            .map_err(|e| format!("Seed users failed: {e}"))?;
        tickets::seed_tickets(&state)
            .await
            .map_err(|e| format!("Seed tickets failed: {e}"))?;
    }

    Ok(state)
}
