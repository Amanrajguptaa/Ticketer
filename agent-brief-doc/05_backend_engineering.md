# AGENT 05: BACKEND ENGINEERING
## Schema · Controllers · Middleware · API Design

### 5.1 Database Schema (Neon / Postgres)
#### Table: `users`
- `id`: UUID (PK)
- `wallet_address`: VARCHAR(58) (Unique) — Algorand address
- `role`: VARCHAR(20) ('student' | 'organizer' | 'admin')
- `display_name`, `email`, `avatar_url`
- `xp_points`: INTEGER (Gamification)

#### Table: `events`
- `id`: UUID (PK)
- `organizer_id`: FK -> users.id
- `name`, `description`, `venue`, `event_date`
- `cover_image_url`, `category`
- `ticket_supply`, `ticket_price` (NUMERIC)
- `algo_app_id`, `algo_asset_id` (Smart contract / NFT data)
- `status`: draft | active | sold_out | ended

#### Table: `tickets`
- `id`: UUID (PK)
- `event_id`: FK -> events.id
- `owner_id`: FK -> users.id
- `owner_wallet`: VARCHAR(58)
- `ticket_number`: INTEGER
- `algo_asset_id`: BIGINT (On-chain NFT)
- `status`: active | used | transferred

#### Table: `gate_scans`
- `id`: UUID (PK)
- `event_id`, `ticket_id`
- `result`: valid | already_used | invalid
- `scanner_device`: User agent string

---

### 5.2 API Routes (Selection)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/wallet-login` | None | Verify signed message, return JWT |
| **POST** | `/events` | Org JWT | Create event + deploy contract |
| **POST** | `/events/:id/purchase-intent` | Student JWT | Create pending purchase, return unsigned txn |
| **POST** | `/tickets/confirm` | Student JWT | Confirm purchase with signed txn ID |
| **POST** | `/gate/verify` | Event Token | Verify ticket QR scan, mark used on-chain |
| **GET** | `/dashboard/events` | Org JWT | Sales metrics for organizer |

---

### 5.3 Middleware Stack
1. `helmet`, `cors`, `express.json` (Security & Parsing)
2. `requestLogger` (Winston logging)
3. `rateLimiter` (100 req/min)
4. `validateApiVersion`
5. **Route Specific:**
   - `authenticate`: Verifies JWT & wallet status.
   - `verifyTicketOnChain`: Uses `algosdk` to confirm ownership and usage state on Algorand.

---

### 5.4 Controller & Service Pattern
- **Thin Controllers:** Handle HTTP req/res mapping.
- **Business Services:** Handle implementation details (e.g., `ticketService` handles availability, DB records, and unsigned transaction construction).

---

### 5.5 Error Handling Strategy
| Error Type | Code | Response Example |
| :--- | :--- | :--- |
| **Validation** | 400 | `{ error: "VALIDATION_ERROR", fields: {...} }` |
| **Unauth** | 401 | `{ error: "UNAUTHENTICATED" }` |
| **No Permission** | 403 | `{ error: "FORBIDDEN" }` |
| **Conflict** | 409 | `{ error: "CONFLICT", message: "Ticket used" }` |
| **Blockchain** | 502 | `{ error: "BLOCKCHAIN_ERROR", message: "Retry" }` |
| **Internal** | 500 | `{ error: "INTERNAL_ERROR" }` |
