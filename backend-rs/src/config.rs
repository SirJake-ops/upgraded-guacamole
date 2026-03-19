use std::net::SocketAddr;
use std::path::PathBuf;

use base64::Engine;
use rand::RngCore;

#[derive(Clone)]
pub struct Config {
    pub bind_addr: SocketAddr,
    pub database_url: String,
    pub cors_origins: Vec<String>,
    pub cookie_key: [u8; 64],
}

fn first_env(keys: &[&str]) -> Option<String> {
    for k in keys {
        if let Ok(v) = std::env::var(k) {
            let v = v.trim().to_string();
            if !v.is_empty() {
                return Some(v);
            }
        }
    }
    None
}

fn parse_u16(s: &str) -> Option<u16> {
    s.parse::<u16>().ok()
}

fn parse_cookie_key(s: &str) -> Option<[u8; 64]> {
    let s = s.trim();
    let raw = if s.len() == 128 && s.chars().all(|c| c.is_ascii_hexdigit()) {
        let mut out = vec![0u8; 64];
        for i in 0..64 {
            let b = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).ok()?;
            out[i] = b;
        }
        out
    } else {
        base64::engine::general_purpose::STANDARD.decode(s.as_bytes()).ok()?
    };

    if raw.len() != 64 {
        return None;
    }
    let mut key = [0u8; 64];
    key.copy_from_slice(&raw);
    Some(key)
}

pub fn load() -> Result<Config, String> {
    dotenvy::dotenv().ok();

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let candidates = [
        manifest_dir.join(".env"),
        manifest_dir.join("../.env"),
        manifest_dir.join("../../.env"),
        manifest_dir.join("../../miniature-doodle/.env"),
    ];
    for p in candidates {
        if let Some(s) = p.to_str() {
            let _ = dotenvy::from_filename(s);
        }
    }

    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = first_env(&["PORT"])
        .and_then(|s| parse_u16(&s))
        .unwrap_or(5177);
    let bind_addr: SocketAddr = format!("{host}:{port}")
        .parse()
        .map_err(|e| format!("Invalid bind addr: {e}"))?;

    let database_url = if let Ok(url) = std::env::var("DATABASE_URL") {
        url
    } else {
        let pg_host = first_env(&["POSTGRES_HOST_DEV", "POSTGRES_HOST"]).unwrap_or_else(|| "localhost".to_string());
        let pg_port = first_env(&["POSTGRES_PORT_DEV", "POSTGRES_PORT"]).unwrap_or_else(|| "5432".to_string());
        let pg_db = first_env(&["POSTGRES_DB_NAME_DEV", "POSTGRES_DB_NAME", "POSTGRES_DB"])
            .unwrap_or_else(|| "tracker".to_string());
        let pg_user = first_env(&["POSTGRES_USERNAME_DEV", "POSTGRES_USER_DEV", "POSTGRES_USER"])
            .unwrap_or_else(|| "postgres".to_string());
        let pg_pass = first_env(&["POSTGRES_PASSWORD_DEV", "POSTGRES_PASSWORD"])
            .ok_or_else(|| "Missing Postgres password. Set POSTGRES_PASSWORD_DEV or POSTGRES_PASSWORD.".to_string())?;
        format!("postgres://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}")
    };

    let cors_origins = vec![
        "http://localhost:1420".to_string(),
        "http://127.0.0.1:1420".to_string(),
        "https://localhost:1420".to_string(),
        "https://127.0.0.1:1420".to_string(),
    ];

    let cookie_key = if let Ok(s) = std::env::var("BT_COOKIE_KEY") {
        parse_cookie_key(&s).ok_or_else(|| "BT_COOKIE_KEY must be 64 bytes (base64) or 128 hex chars.".to_string())?
    } else {
        let mut key = [0u8; 64];
        let mut rng = rand::thread_rng();
        rng.fill_bytes(&mut key);
        let b64 = base64::engine::general_purpose::STANDARD.encode(key);
        eprintln!("BT_COOKIE_KEY is not set. Cookies will be invalid after restart. Generate a stable key and put this in your .env:\nBT_COOKIE_KEY={b64}\n");
        key
    };

    Ok(Config {
        bind_addr,
        database_url,
        cors_origins,
        cookie_key,
    })
}
