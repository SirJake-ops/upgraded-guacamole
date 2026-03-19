mod auth;
mod chat;
mod config;
mod state;
mod tickets;

use axum::{
    routing::{get, post},
    Router,
};
use axum_extra::extract::cookie::Key;
use http::{header, HeaderValue, Method};
use sqlx::postgres::PgPoolOptions;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;


#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let cfg = match config::load() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    };

        Ok(s) => s,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(1);
        }
    };

    let cors = {
        let mut allowed = Vec::with_capacity(cfg.cors_origins.len());
        for o in &cfg.cors_origins {
            if let Ok(v) = o.parse::<HeaderValue>() {
                allowed.push(v);
            }
        }
        CorsLayer::new()
            .allow_origin(allowed)
            .allow_credentials(true)
            .allow_headers([header::CONTENT_TYPE, header::ACCEPT, header::AUTHORIZATION])
            .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
    };

        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(cfg.bind_addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn build_state(cfg: &Config) -> Result<AppState, String> {
    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&cfg.database_url)
        .await
        .map_err(|e| format!("DB connect failed: {e}"))?;

    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .map_err(|e| format!("DB migrate failed: {e}"))?;

    let key = Key::from(&cfg.cookie_key);
    let (chat_tx, _) = tokio::sync::broadcast::channel(256);
    let state = AppState {
        db,
        cookie_key: key,
        chat_tx,
    };

    #[cfg(feature = "qa")]
    {
        auth::seed_users(&state)
            .await
            .map_err(|e| format!("Seed users failed: {e}"))?;
        tickets::seed_tickets(&state)
            .await
            .map_err(|e| format!("Seed tickets failed: {e}"))?;
    }

    Ok(state)
}
