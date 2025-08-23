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
}
