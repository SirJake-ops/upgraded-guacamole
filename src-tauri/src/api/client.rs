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

    pub async fn simple_hello(&self) -> Result<String, reqwest::Error> {
        println!("{}", self.url);
        let url = format!("{}/api/tickets/hello", self.url);
        let response = self.client.get(&url).send().await?;
        let text = response.text().await?;
        Ok(text)
    }
}
