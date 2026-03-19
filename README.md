# Ticket System (Tauri + Solid) with Rust API (Axum)

Internal ticket management app with role-scoped dashboards, cookie-based authentication, and a Rust API backed by PostgreSQL.

## Overview

This repo contains:

- A SolidJS frontend (runs in the browser during dev).
- A Tauri desktop shell (optional).
- A Rust backend API (`backend-rs`) using Axum + SQLx + Postgres.

An older .NET backend existed during earlier development, but the active backend for this project is now Rust.

## Features

- Ticket CRUD: create, list, view, update, delete
- Role-scoped ticket visibility (Admin sees all, others see tickets they submitted/are assigned)
- Cookie-only auth with server-side sessions (idle timeout + absolute expiry)
- WebSocket chat endpoint (`/ws/chat`) authenticated via the same session cookie

## Repo Layout

```
.
├── backend-rs/     # Rust API (Axum + SQLx)
├── src/            # SolidJS UI
├── src-tauri/      # Tauri desktop shell
├── public/
└── dist/           # Vite build output
```

## Prerequisites

- Node.js (for the UI)
- Rust toolchain (stable)
- PostgreSQL (local install or Docker)

## Quick Start (UI + Rust API)

1. Configure env:

- Copy `.env.example` to `.env` and fill in values as needed.
- Generate a stable cookie key:

```bash
npm run gen:cookie-key
```

Put it in `.env` as `BT_COOKIE_KEY=...`. Without a stable key, cookies break after backend restarts.

2. Start UI + Rust API:

```bash
npm run dev:rust
```

- UI: `http://localhost:1420`
- API: `http://localhost:5177`

## Tauri Dev (Optional)

If you want the desktop shell as well:

```bash
npm run tauri-dev:rust
```

Note: on some Wayland compositors this can fail due to WebView/Wayland issues unrelated to the API.

## Environment Variables

Backend (`backend-rs`) supports either `DATABASE_URL` or the Postgres env var set used elsewhere in this project:

```bash
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432
POSTGRES_DB_NAME_DEV=tracker
POSTGRES_USERNAME_DEV=postgres
POSTGRES_PASSWORD_DEV=postgres

BT_COOKIE_KEY=... # required for stable cookie sessions
SESSION_IDLE_MINUTES=30
SESSION_ABSOLUTE_HOURS=2
```

Frontend:

```bash
VITE_API_BASE_URL=http://localhost:5177
```

If not set, the UI will fall back to its default base URL.

## Demo Users

If your database is seeded with demo users:

- `admin@demo.local` / `Password123!`
- `doctor@demo.local` / `Password123!`
- `nurse@demo.local` / `Password123!`
- `user@demo.local` / `Password123!`

## API Surface

REST:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/user`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/{ticketId}`
- `PUT /api/tickets/{ticketId}`
- `DELETE /api/tickets/{ticketId}`
- `POST /api/tickets/{ticketId}` (assign)

WebSockets:

- `GET /ws/chat`


