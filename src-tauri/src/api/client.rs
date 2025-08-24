use reqwest::Client;

pub struct ApiClient {
    client: Client,
    url: String,
}

impl ApiClient {
    pub fn new(base_url: &str) -> Self {
        Self {
            client: Client::new(),
            url: base_url.to_string(),
        }
    }
}
