# backend-rs

Rust API for the ticket system.

## Run

From the repo root:

```bash
npm run api:rust:qa
```

Default bind: `127.0.0.1:5177`

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/user`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/{ticketId}`
- `PUT /api/tickets/{ticketId}`
- `DELETE /api/tickets/{ticketId}`
- `POST /api/tickets/{ticketId}` (assign)
- `GET /ws/chat` (WebSocket)

## Auth

Cookie-only auth with server-side sessions stored in Postgres (`UserSessions`).

Timeouts:

- `SESSION_IDLE_MINUTES` (default `30`)
- `SESSION_ABSOLUTE_HOURS` (default `2`)

Set `BT_COOKIE_KEY` in `.env` for stable cookie sessions across restarts.

## Database

Uses `DATABASE_URL` if set, otherwise:

- `POSTGRES_HOST_DEV` / `POSTGRES_HOST`
- `POSTGRES_PORT_DEV` / `POSTGRES_PORT`
- `POSTGRES_DB_NAME_DEV` / `POSTGRES_DB_NAME` / `POSTGRES_DB`
- `POSTGRES_USERNAME_DEV` / `POSTGRES_USER_DEV` / `POSTGRES_USER`
- `POSTGRES_PASSWORD_DEV` / `POSTGRES_PASSWORD`

