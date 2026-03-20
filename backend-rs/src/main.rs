use http::{header, HeaderValue, Method};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

use backend_rs::config;

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

    let state = match backend_rs::build_state(&cfg).await {
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

    let app = backend_rs::base_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(cfg.bind_addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

