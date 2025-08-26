use crate::api::client::ApiClient;

//This is strictly here for a reference still learning tauri framework
#[tauri::command]
pub async fn test_hello(api_client: tauri::State<'_, ApiClient>) -> Result<String, String> {
    println!("Test hello");
    match api_client.simple_hello().await {
        Ok(response) => Ok(response),
        Err(error) => Err(error.to_string()),
    }
}
