use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use axum_extra::extract::cookie::PrivateCookieJar;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::{auth, chat::ChatEvent, state::AppState};

#[derive(Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TicketMessage {
    #[sqlx(rename = "MessageId")]
    pub message_id: i64,
    #[sqlx(rename = "TicketId")]
    pub ticket_id: Uuid,
    #[sqlx(rename = "SenderId")]
    pub sender_id: Uuid,
    #[sqlx(rename = "Body")]
    pub body: String,
    #[sqlx(rename = "CreatedAt")]
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTicketMessageBody {
    pub body: String,
}

#[derive(Debug, FromRow)]
struct TicketAccessRow {
    #[sqlx(rename = "SubmitterId")]
    submitter_id: Uuid,
    #[sqlx(rename = "AssigneeId")]
    assignee_id: Option<Uuid>,
}

async fn require_ticket_access(
    state: &AppState,
    viewer_id: Uuid,
    role: &str,
    ticket_id: Uuid,
) -> Result<(), StatusCode> {
    let is_admin = role.eq_ignore_ascii_case("Admin");
    if is_admin {
        return Ok(());
    }

    let row = sqlx::query_as::<_, TicketAccessRow>(
        "SELECT \"SubmitterId\", \"AssigneeId\" FROM \"Tickets\" WHERE \"TicketId\" = $1 LIMIT 1",
    )
    .bind(ticket_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let Some(row) = row else {
        return Err(StatusCode::NOT_FOUND);
    };

    if row.submitter_id == viewer_id || row.assignee_id == Some(viewer_id) {
        Ok(())
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

pub async fn list_messages(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path(ticket_id): Path<Uuid>,
) -> impl IntoResponse {
    let (viewer_id, role) = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    if let Err(code) = require_ticket_access(&state, viewer_id, &role, ticket_id).await {
        return code.into_response();
    }

    let rows = sqlx::query_as::<_, TicketMessage>(
        "SELECT \"MessageId\", \"TicketId\", \"SenderId\", \"Body\", \"CreatedAt\" \
         FROM \"TicketMessages\" \
         WHERE \"TicketId\" = $1 \
         ORDER BY \"CreatedAt\" ASC, \"MessageId\" ASC \
         LIMIT 200",
    )
    .bind(ticket_id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(v) => Json(v).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn create_message(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path(ticket_id): Path<Uuid>,
    Json(body): Json<CreateTicketMessageBody>,
) -> impl IntoResponse {
    let (viewer_id, role) = match auth::require_session(&state, &jar).await {
        Ok(v) => v,
        Err(code) => return code.into_response(),
    };

    if let Err(code) = require_ticket_access(&state, viewer_id, &role, ticket_id).await {
        return code.into_response();
    }

    let msg_body = body.body.trim().to_string();
    if msg_body.is_empty() {
        return (StatusCode::BAD_REQUEST, "Message body is required").into_response();
    }
    if msg_body.len() > 4000 {
        return (StatusCode::BAD_REQUEST, "Message too long").into_response();
    }

    let now = Utc::now();
    let inserted = sqlx::query_as::<_, TicketMessage>(
        "INSERT INTO \"TicketMessages\" (\"TicketId\", \"SenderId\", \"Body\", \"CreatedAt\") \
         VALUES ($1,$2,$3,$4) \
         RETURNING \"MessageId\", \"TicketId\", \"SenderId\", \"Body\", \"CreatedAt\"",
    )
    .bind(ticket_id)
    .bind(viewer_id)
    .bind(msg_body)
    .bind(now)
    .fetch_one(&state.db)
    .await;

    let inserted = match inserted {
        Ok(v) => v,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };

    let _ = state.chat_tx.send(ChatEvent {
        kind: "ticketMessage".to_string(),
        room: format!("ticket:{ticket_id}"),
        ticket_id: Some(ticket_id),
        message_id: Some(inserted.message_id),
        from_user_id: viewer_id,
        from_role: role,
        body: inserted.body.clone(),
        sent_at: inserted.created_at,
    });

    Json(inserted).into_response()
}

