# AGENT 01: PRODUCT & OVERVIEW
## Features · Flows · User Stories · Personas

### 1.1 Product Vision
**TicketChain** is a Web3-native event ticketing platform for college campuses where every ticket is an NFT on Algorand. 
- **Organizers:** Mint tickets as NFTs.
- **Students:** Buy and own tickets in their wallets.
- **Gate Staff:** Verify entry by reading the blockchain.

**Key Benefits:** No central database, no forgeable screenshots, no fraud.

---

### 1.2 Problem Space
#### 🔴 The Three Problems TicketChain Solves
1. **Fake Tickets:** Screenshot sharing and printouts lead to gatecrashing and lost revenue.
2. **No Ownership:** Students hold tickets in platforms that can revoke or lose access.
3. **Painful Verification:** Manual scanning of PDFs and Excel lists is slow and error-prone.

#### 🟢 How TicketChain Fixes This
1. **NFT Tickets:** Unique on-chain NFTs. Wallet-based ownership verifiable in real-time.
2. **Self-Custody:** Students hold NFTs in Pera Wallet; they can transfer/prove ownership.
3. **2-Second Gate Check:** Web-based scanner queries Algorand in ~2 seconds, marks NFT as used.

---

### 1.3 User Personas

#### Persona A — The Organizer (Arjun, Fest Coordinator, 21)
- **Goal:** Sell 500 tickets, prevent gatecrashing, track revenue.
- **Frustration:** Lost revenue from fake screenshots in previous years.
- **Tech Level:** Familiar with Razorpay/Sheets; first-time Web3 user.
- **Device:** MacBook (Dashboard), iPhone (Gate).
- **Key Job:** Create event → set price/supply → monitor sales → run gate verification.

#### Persona B — The Student (Priya, 2nd Year, 19)
- **Goal:** Buy ticket, show at gate, potential resale.
- **Frustration:** Missing events due to manual forms or lost PDF emails.
- **Tech Level:** High social media usage; no prior crypto wallet experience.
- **Device:** Android phone.
- **Key Job:** Discover events → connect wallet → buy ticket → show QR at gate.

#### Persona C — The Gate Staff (Ravi, Security Guard / Volunteer, 22)
- **Goal:** Efficiently validate ticket holders, block gatecrashers.
- **Frustration:** Inability to distinguish real vs. fake PDFs.
- **Tech Level:** Basic smartphone user (WhatsApp); non-technical.
- **Device:** Budget Android phone.
- **Key Job:** Open verification URL → scan QR → act on yes/no result.

---

### 1.4 Feature List

| Feature | User | Priority | Web3 Required? |
| :--- | :--- | :--- | :--- |
| Create Event (title, date, venue, supply, price) | Organizer | P0 | Yes — mints NFTs |
| Event Discovery Page | Student | P0 | No |
| Buy Ticket with Wallet | Student | P0 | Yes — NFT transfer |
| My Tickets Dashboard | Student | P0 | Yes — reads wallet |
| QR Code Generation per NFT | Student | P0 | Yes — NFT ID based |
| Gate Verification (scan + on-chain check) | Gate Staff | P0 | Yes — marks NFT used |
| Organizer Dashboard (sales, revenue) | Organizer | P0 | Yes — reads contract |
| Ticket Resale / Transfer | Student | P1 | Yes — NFT transfer |
| Royalty on Resale | Organizer | P1 | Yes — smart contract |
| Event Categories & Search | Student | P1 | No |
| Waitlist Management | Organizer | P1 | No |
| Post-Event Attendance Report | Organizer | P1 | Yes — on-chain read |
| Gamification Badges / XP | Student | P2 | Partial — Trophy.so |
| Creator Verified Badge | Organizer | P2 | Yes — ASA token |
| Multi-event Wallet History | Student | P2 | Yes — reads wallet |

---

### 1.5 User Stories

- **US-001 [Organizer]:** Create event and mint 200 NFT tickets to control supply.
  - *Criteria:* Form for details; Smart contract mints NFTs to custody; Unique metadata; Dashboard visibility.
- **US-002 [Student]:** Buy ticket with Pera Wallet for true ownership.
  - *Criteria:* Pera Wallet connect; ALGO payment approval; NFT transfer to student; Receipt in 10s.
- **US-003 [Student]:** Show QR code on phone for gate entry.
  - *Criteria:* QR button on ticket card; Derived from NFT Asset ID; Offline support; State changes to "USED".
- **US-004 [Gate Staff]:** Scan QR code for instant validity check.
  - *Criteria:* No-login web URL; Camera permission; <3s scan result (Green/Red); Error reasons shown.
- **US-005 [Organizer]:** Real-time sales and revenue monitoring.
  - *Criteria:* Sold/available counter; ALGO/USD revenue; Sales timeline; Sale controls (pause/add).
- **US-006 [Student]:** Transfer ticket to a friend if unable to attend.
  - *Criteria:* Restricted by organizer toggle; Wallet-to-wallet transfer; Royalty logic applied; Instant update for new owner.

---

### 1.6 Product Scope — Hackathon Focus

| In Scope (Build This) | Out of Scope (Post-Hackathon) |
| :--- | :--- |
| Event creation + NFT minting via AlgoKit | Fiat payment gateway (INR → ALGO) |
| Ticket purchase with Pera Wallet on Testnet | Mobile native app (iOS/Android) |
| My Tickets dashboard with QR codes | Multi-chain support |
| Gate verification screen (mobile-optimized) | KYC / identity verification |
| Organizer dashboard with sales data | Complex dispute resolution |
| Ticket transfer between wallets | Calendar app integrations |
| Resale royalty logic in smart contract | SMS / WhatsApp notifications |
| Landing page with full branding | Analytics beyond basic dashboard |
