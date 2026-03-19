use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    http::StatusCode,
    response::IntoResponse,
};
use axum_extra::extract::cookie::PrivateCookieJar;
use chrono::{DateTime, Utc};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{auth, state::AppState};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatEvent {
    pub kind: String,
    pub room: String,
    pub from_user_id: Uuid,
    pub from_role: String,
    pub body: String,
    pub sent_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClientMsg {
    room: Option<String>,
    body: String,
}

pub async fn ws_chat(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    jar: PrivateCookieJar,
) -> impl IntoResponse {
    let (user_id, role) = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(_) => return StatusCode::UNAUTHORIZED.into_response(),
    };

    ws.on_upgrade(move |socket| handle_socket(socket, state, user_id, role))
}

async fn handle_socket(socket: WebSocket, state: AppState, user_id: Uuid, role: String) {
    let mut rx = state.chat_tx.subscribe();

    let (mut sender, mut receiver) = socket.split();

    let mut send_task = tokio::spawn(async move {
        while let Ok(evt) = rx.recv().await {
            let Ok(text) = serde_json::to_string(&evt) else { continue };
            if sender.send(Message::Text(text)).await.is_err() {
                break;
            }
        }
    });

    let tx = state.chat_tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            let text = match msg {
                Message::Text(t) => t,
                Message::Close(_) => break,
                _ => continue,
            };

            let parsed: ClientMsg = match serde_json::from_str(&text) {
                Ok(v) => v,
                Err(_) => continue,
            };

            let body = parsed.body.trim().to_string();
            if body.is_empty() {
                continue;
            }

            let room = parsed.room.unwrap_or_else(|| "global".to_string());

            let _ = tx.send(ChatEvent {
                kind: "chat".to_string(),
                room,
                from_user_id: user_id,
                from_role: role.clone(),
                body,
                sent_at: Utc::now(),
            });
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
}
