# Ticketer API

Backend for TicketChain: Neon PostgreSQL + Prisma 6. Stores user profiles (wallet address + role: organizer | student | gate).

## Setup

1. **Install and DB**

   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

   `DATABASE_URL` and `DIRECT_URL` are in `.env` (Neon). Run `db push` from a network that can reach Neon.

2. **Run**

   ```bash
   npm run dev
   ```

   API runs at `http://localhost:3001`.

## Endpoints

- **GET /health** — Health check. Returns `200` if DB is reachable, `503` if not (with hint).
- **GET /api/profile?wallet=ALGO_ADDRESS** — Get profile. Returns `404` if none, `503` if DB unavailable.
- **POST /api/profile** — Create profile. Body: `{ "wallet": "ALGO_ADDRESS", "role": "organizer" | "student" | "gate" }`. Returns `409` if profile already exists.

## DB unreachable (P1001 / "Can't reach database server")

- **Check network**: Some networks block outbound PostgreSQL. Try another Wi‑Fi or disable VPN.
- **Neon cold start**: If the project was idle, Neon may take 5–10 seconds to wake. Wait and retry or call `GET /health`.
- **Correct URLs**: In Neon Console → Connect, copy the **pooled** URL → `DATABASE_URL` and **direct** URL (no `-pooler` in host) → `DIRECT_URL`.
- **Timeouts**: `.env` uses `connect_timeout=30`. If it still times out, the host is likely unreachable from your network.
