use mail_parser::Message;
use tauri::webview::cookie::ParseError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("Email missing 'From' field")]
    MissingFrom,

    #[error("Email missing 'To' field")]
    MissingTo,

    #[error("Email missing subject")]
    MissingSubject,

    #[error("Invalid email address")]
    InvalidEmailAddress,

    #[error("Empty Title")]
    EmptyTitle,

    #[error("Email body is invalid")]
    InvalidEmailBody,
}

pub struct EmailType {
    pub sender: String,
    pub receiver: String,
    pub title: String,
    pub body: String,
}

impl EmailType {
    pub fn new(sender: &str, receiver: &str, title: &str, body: &str) -> EmailType {
        EmailType {
            sender: sender.to_string(),
            receiver: receiver.to_string(),
            title: title.to_string(),
            body: body.to_string(),
        }
    }

    pub fn from_parsed_email(message: &Message) -> Result<EmailType, EmailError> {
        Ok(EmailType {
            sender: message
                .from()
                .ok_or(EmailError::MissingFrom)?
                .first()
                .ok_or(EmailError::InvalidEmailAddress)?
                .address()
                .ok_or(EmailError::InvalidEmailAddress)?
                .to_string(),
            receiver: message
                .to()
                .ok_or(EmailError::MissingTo)?
                .first()
                .ok_or(EmailError::InvalidEmailAddress)?
                .address()
                .ok_or(EmailError::InvalidEmailAddress)?
                .to_string(),
            title: message.subject().ok_or(EmailError::EmptyTitle)?.to_string(),
            body: message
                .body_text(0)
                .ok_or(EmailError::InvalidEmailBody)?
                .to_string(),
        })
    }
}
