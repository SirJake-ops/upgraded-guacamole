mod common;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;
use uuid::Uuid;

#[tokio::test]
async fn tickets_crud_and_assign_flow() {
    let (pool, _db) = common::setup_db().await;
    let user_id = common::seed_user(&pool, "testuser", "testEmail@test.com", "User", "123abc").await;

    let state = common::app_state(pool.clone());
    let app = backend_rs::base_router(state);

    // Unauthorized should fail.
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/tickets")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    // Login to get session cookie.
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
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();
    let cookie_kv = common::extract_cookie_kv(&set_cookie);

    // Create ticket.
    let create_body = serde_json::json!({
        "submitterId": user_id,
        "environment": 1,
        "title": "Test Ticket",
        "description": "This is a test ticket.",
        "stepsToReproduce": "1. Do this\n2. Do that",
        "expectedResult": "Expected outcome",
        "files": [],
        "isResolved": false,
    });
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/tickets")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie_kv)
                .body(Body::from(create_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let created: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(created["title"].as_str().unwrap(), "Test Ticket");
    assert_eq!(created["submitterId"].as_str().unwrap(), user_id.to_string());
    let ticket_id = Uuid::parse_str(created["ticketId"].as_str().unwrap()).unwrap();

    // List tickets (submitterId query is ignored for non-admin, but should still include our ticket).
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(&format!("/api/tickets?submitterId={user_id}"))
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let tickets: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let arr = tickets.as_array().unwrap();
    assert!(arr.iter().any(|t| t["ticketId"].as_str().unwrap() == ticket_id.to_string()));
    assert!(arr.iter().all(|t| {
        let sid = t["submitterId"].as_str().unwrap();
        sid == user_id.to_string()
    }));

    // Update ticket.
    let update_body = serde_json::json!({
        "submitterId": user_id,
        "environment": 0,
        "title": "Updated Test Ticket",
        "description": "This is an updated test ticket.",
        "stepsToReproduce": "1. Do this\n2. Do that",
        "expectedResult": "Expected outcome",
        "files": [],
        "isResolved": false,
    });
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(&format!("/api/tickets/{ticket_id}"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie_kv)
                .body(Body::from(update_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let updated: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(updated["title"].as_str().unwrap(), "Updated Test Ticket");

    // Assign ticket.
    let assign_body = serde_json::json!({
        "userId": user_id,
    });
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(&format!("/api/tickets/{ticket_id}"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie_kv)
                .body(Body::from(assign_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    // Verify assignee via GET by id.
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(&format!("/api/tickets/{ticket_id}"))
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let ticket: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(ticket["assigneeId"].as_str().unwrap(), user_id.to_string());

    // Delete ticket.
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(&format!("/api/tickets/{ticket_id}"))
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NO_CONTENT);

    // Ensure gone.
    let resp = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(&format!("/api/tickets/{ticket_id}"))
                .header(header::COOKIE, &cookie_kv)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

