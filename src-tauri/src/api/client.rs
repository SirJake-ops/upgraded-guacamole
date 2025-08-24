pub struct ApiClient {
    pub base_url: String,
    pub api_key: String,
}

impl ApiClient {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
            api_key: api_key.to_string(),
        }
    }
}
