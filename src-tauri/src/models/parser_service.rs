use crate::models::email::EmailType;

pub struct Parser {
    pub content: EmailType
}

impl Parser {
    pub fn new(content: EmailType) -> Self {
        Parser { content }
    }
}