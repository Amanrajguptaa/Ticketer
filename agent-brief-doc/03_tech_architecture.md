# AGENT 03: TECH ARCHITECTURE
## Full Stack Blueprint · System Design · Data Flow

### 3.1 High-Level Architecture
🏗 **System Components**
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion (Vercel)
- **Backend API:** Node.js + Express + TypeScript (Railway / Render)
- **Database:** Neon (Serverless Postgres) — Metadata, profiles, logs
- **Blockchain:** Algorand Testnet — NFTs, smart contracts, verification
- **Smart Contract:** AlgoKit + Python (ARC-19 NFT standard)
- **Wallet:** Pera Wallet Connect (via `@txnlab/use-wallet`)
- **Storage:** Cloudinary (Images), IPFS via Pinata (NFT Metadata)
- **Auth:** Wallet-based (message signing) + NextAuth for organizers

---

### 3.2 Frontend Stack
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `next` | `14.x` | App framework, SSR/SSG, API routes |
| `@txnlab/use-wallet` | `3.x` | Algorand wallet connection (Pera, Defly) |
| `algosdk` | `2.x` | Transaction building, API reads |
| `@tanstack/react-query` | `5.x` | Server state, caching |
| `framer-motion` | `11.x` | Animations and gesture handling |
| `zustand` | `4.x` | Global client-side UI state |
| `qrcode.react` | `3.x` | QR generation from NFT IDs |
| `html5-qrcode` | `2.x` | Camera-based QR scanning |

---

### 3.3 Backend Stack
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `express` | `4.x` | HTTP server and routing |
| `drizzle-orm` | `latest` | Type-safe ORM for Postgres |
| `@neondatabase/serverless` | `latest` | Neon Postgres driver |
| `algosdk` | `2.x` | Contract calls, asset reads |
| `@pinata/sdk` | `latest` | IPFS NFT metadata upload |
| `cloudinary` | `2.x` | Image storage and transforms |

---

### 3.4 System Data Flow

#### Ticket Purchase Flow (End-to-End)
1. **Purchase Intent:** Student clicks "Buy" → Frontend calls `POST /api/events/:id/purchase-intent` → Backend creates pending record in Neon.
2. **Txn Construction:** Frontend builds unsigned Payment Transaction via `algosdk`.
3. **Wallet Signing:** Student signs transaction via **Pera Wallet** popup.
4. **Broadcast:** Frontend submits signed txn to **Algorand Testnet**.
5. **Smart Contract:** On-chain logic verifies payment and transfers **NFT (ASA)** to student wallet.
6. **Confirmation:** Frontend polls for confirmation (~4s) via `waitForConfirmation`.
7. **Verification:** Frontend calls `POST /api/tickets/confirm` → Backend verifies txn on-chain via AlgoNode API.
8. **DB Update:** Backend updates Neon DB; ticket record marked as **SOLD**.
9. **Display:** UI refetches via React Query; ticket appears in "My Tickets".

---

### 3.5 Deployment Architecture
| Service | Platform | Environment | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | Preview/Production | Edge network, automatic deploys |
| **Backend** | Railway | Staging/Production | Dockerized, auto-scaling |
| **Database** | Neon Cloud | Serverless | Connection pooling via PgBouncer |
| **Blockchain** | Algorand | Testnet | Hackathon focus |
| **Metadata** | Pinata | Production | IPFS permanent pinning |
| **Images** | Cloudinary | Production | Optimized image delivery |
