# AGENT 06: WEB3 / ALGORAND
## AlgoKit · Smart Contracts · NFT Standard · ARC-19

### 6.1 Algorand Concepts Used
| Concept | What It Is | TicketChain Usage |
| :--- | :--- | :--- |
| **ASA** | Algorand Standard Asset | Each ticket is an NFT ASA with unique metadata. |
| **ARC-19** | NFT standard | Metadata URI on IPFS (Pinata). |
| **Smart Contract**| On-chain program (AVM) | Manages sales, transfers, and used-state. |
| **Atomic Txns** | Bundled transactions | Ensures "Payment + NFT Transfer" happens atomically. |
| **Opt-in** | ASA permission | Student wallets must opt-in before receiving the NFT. |
| **AlgoKit** | Dev toolkit | Scaffolding, testing, and Testnet deployment. |
| **Pera Wallet** | Wallet provider | Primary connection for students and organizers. |

---

### 6.2 AlgoKit Setup
1. **LocalNet:** `algokit localnet start` (for development).
2. **Scaffold:** `algokit init --name ticketchain-contracts --template python`.
3. **Structure:**
   - `contracts/ticketchain/ticketchain.py`: Main contract.
   - `tests/test_ticketchain.py`: Pytest tests.
   - `deploy/deploy.py`: Deployment scripts.

---

### 6.3 Smart Contract Design (Python / AlgoKit)
**Core Responsibilities:**
- `create_event()`: Stores config (price, supply, royalty) and mints ASAs.
- `buy_ticket()`: Atomic grouping of ALGO payment and Inner Transaction (ITXN) asset transfer.
- `verify_and_use()`: Checks ownership and marks as "Used" in on-chain storage.
- `withdraw()`: Collects ALGO revenue for the organizer.

---

### 6.4 NFT Metadata (ARC-19)
Tickets use **IPFS** for metadata storage.
- Key properties: `event_id`, `ticket_number`, `event_date`, `venue`, `status` (active/used).

---

### 6.5 Atomic Transaction Group — Buy Ticket
To prevent partial failures (e.g., payment without NFT delivery), TicketChain uses **Atomic Groups**:
1. **Opt-in Txn:** Student account opts in to the ticket ASA.
2. **Payment Txn:** Student sends ALGO to the smart contract.
3. **App Call Txn:** Method call to `buy_ticket` which triggers the NFT transfer.
*Result:* All 3 succeed or none do.

---

### 6.6 Gate Verification Flow
1. **Scan:** Gate staff scans QR (contains `assetId:walletAddress`).
2. **Check:** Backend queries Algorand API (AlgoNode) to confirm wallet holds the asset.
3. **Double-Spend:** Check Neon DB to ensure the `assetId` wasn't already scanned.
4. **On-Chain:** (Optional) Call `verify_and_use()` on-contract for decentralized proof.
5. **Feed:** Screen flashes Green on success.

---

### 6.7 Deployment Checklist
- [ ] Run `algokit localnet start`.
- [ ] Implement contract and pass `pytest` tests.
- [ ] Deploy to Testnet: `algokit deploy --network testnet`.
- [ ] Record **ALGO_APP_ID** and **ASA ID** for use in `.env` and Neon DB.
- [ ] Verify deployment on [Testnet Explorer](https://testnet.explorer.perawallet.app/).
