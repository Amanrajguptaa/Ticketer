# AGENT 07: GAMIFICATION
## Trophy.so Integration · XP · Badges · Streaks

### 7.1 Gamification Verdict
**Why Gamify?**
- **Conversion:** Reduces friction for new Algorand wallet creation.
- **Retention:** Rewards repeat behavior with streaks and tiers.
- **Social Proof:** Badges act as on-campus social currency.
- **Economics:** Encourages early ticket buying and multi-event attendance.

---

### 7.2 Trophy.so Integration
**Trophy.so** provides the infrastructure for XP, achievements, streaks, and leaderboards.
- **API Events:** `POST /v1/users/:userId/events` to track actions.
- **Webhooks:** Triggers when achievements are unlocked; backend listens to update UI.
- **UI:** Render Trophy React components or fetch data for custom designs.

---

### 7.3 XP & Level System
| Action | XP | Trigger |
| :--- | :--- | :--- |
| First Wallet Connect | +100 | Auth success |
| Buy First Ticket | +200 | Confirmation in wallet |
| Buy Any Ticket | +50 | Each purchase |
| Attend Event (Scan) | +100 | Gate scan record |
| Transfer to Friend | +30 | NFT transfer confirmed |
| Early Bird (1hr) | +150 | Purchase < 1hr from launch |

**Tiers:**
- `Level 1 (0 XP)`: Newcomer
- `Level 2 (300 XP)`: Regular (Waitlist Priority)
- `Level 3 (800 XP)`: Enthusiast (1hr Early Access)
- `Level 4 (2000 XP)`: VIP (Visible VIP badge)
- `Level 5 (5000 XP)`: Festival Elite (Exclusive invites)

---

### 7.4 Achievement Badges
- **First On-Chain:** Buy first NFT.
- **Early Bird:** Buy within 1hr of launch.
- **Faithful Fan:** Attend 5 events total.
- **Genre Explorer:** Attend 5 unique categories.
- **Social Butterfly:** Transfer a ticket.
- **Monthly Streak:** Attend events 3 months in a row.
- **Event Maker (Organizer):** Deploy first event.
- **Full House (Organizer):** Sell out an event.

---

### 7.5 Integration Logic
#### Backend: Fire Event
```typescript
// services/trophy.service.ts
export async function trackEvent(userId: string, eventName: string, metadata?: object) {
  await axios.post(`${TROPHY_API}/users/${userId}/events`, {
    name: eventName,
    timestamp: new Date().toISOString(),
    metadata,
  }, { headers: { 'X-API-Key': TROPHY_KEY } });
}
```

#### Webhook Handler
- Updates user XP in Neon DB.
- Sends real-time notification to frontend via **Server-Sent Events (SSE)**.

---

### 7.6 Feature Locations
- **Student Profile:** XP bar, level badges, and achievement grid.
- **My Tickets:** Streak counters and milestone animations.
- **Event Detail:** VIP badges or early sale timers based on level.
- **Post-Scan:** Achievement toasts and vibration feedback.
- **Home:** Campus-wide leaderboards.

---

### 7.7 Guardrails
- **Core Access:** Level 1 users must have full core functionality.
- **Avoid Spam:** Limit toasts; never interrupt the gate verification process.
- **Earned Only:** XP is not a currency and cannot be purchased.
- **Performance:** Keep the gate verifier screen clean of gamification elements.
