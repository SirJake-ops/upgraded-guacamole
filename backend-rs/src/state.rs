use axum_extra::extract::cookie::Key;
use sqlx::PgPool;
use tokio::sync::broadcast;

use crate::chat::ChatEvent;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub cookie_key: Key,
    pub chat_tx: broadcast::Sender<ChatEvent>,
}

impl axum::extract::FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        state.cookie_key.clone()
    }
}
