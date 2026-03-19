mod common;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

#[tokio::test]
async fn login_current_user_logout_flow() {
    let (pool, _db) = common::setup_db().await;
    let user_id = common::seed_user(&pool, "testuser", "testEmail@test.com", "User", "123abc").await;

    let state = common::app_state(pool);
    let app = backend_rs::base_router(state);

    let login_body = serde_json::json!({
        "userName": "testuser",
        "password": "123abc",
    });

    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(login_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::OK);
    let set_cookie = resp
        .headers()
        .get_all(header::SET_COOKIE)
        .iter()
        .next()
        .expect("missing set-cookie")
        .to_str()
        .unwrap()
        .to_string();
    assert!(set_cookie.contains("bt_session="));
    let cookie_kv = common::extract_cookie_kv(&set_cookie);

    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let user: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(user["id"].as_str().unwrap(), user_id.to_string());
    assert_eq!(user["userName"].as_str().unwrap(), "testuser");

    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/auth/user")
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let me: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(me["id"].as_str().unwrap(), user_id.to_string());

    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/logout")
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let resp = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/auth/user")
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

