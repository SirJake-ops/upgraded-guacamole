use serde::Serialize;
use tauri::Emitter;
use uuid::Uuid;

#[derive(Clone, Serialize)]
#[serde(tag = "type", content = "payload")]
pub enum AppEvent {
    TicketCreated { ticket_id: Uuid, subject: String },
    TicketUpdated { ticket_id: Uuid },
}

#[derive(Clone)]
pub struct NotificationService;

impl NotificationService {
    pub fn new() -> Self {
        Self
    }

    pub fn emit<R, E>(&self, emitter: &E, event: AppEvent) -> tauri::Result<()>
    where
        R: tauri::Runtime,
        E: Emitter<R>,
    {
        emitter.emit("notification", event)
    }
}
