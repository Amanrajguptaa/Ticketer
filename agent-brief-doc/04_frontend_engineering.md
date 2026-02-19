# AGENT 04: FRONTEND ENGINEERING
## Next.js · Animations · SOLID · Mobile First

### 4.1 Project Structure
src/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # Landing page route group
│   │   └── page.tsx
│   ├── (app)/                  # Authenticated app route group
│   │   ├── dashboard/          # Organizer dashboard
│   │   ├── events/             # Event discovery + detail
│   │   ├── tickets/            # Student ticket wallet
│   │   └── profile/            # User settings
│   ├── verify/                 # Gate verifier (no auth)
│   ├── api/                    # Next.js API routes (proxies)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # Atomic — Button, Badge, Modal, Input
│   ├── features/               # Feature — TicketCard, EventCard, QRScanner
│   ├── layouts/                # AppShell, Sidebar, MobileNav
│   └── providers/              # WalletProvider, QueryProvider, ThemeProvider
├── lib/                        # Utilities, constants, formatters
├── hooks/                      # useTickets, useEvent, useWalletBalance
├── store/                      # Zustand stores
├── types/                      # Shared TypeScript types + Zod schemas
└── services/                   # API client, Algorand client, IPFS client

---

### 4.2 Key Component Architecture (SOLID)
- **Single Responsibility (SRP):** `TicketCard` only handles presentation. Data fetching is delegated to `useTickets` in the parent; QR logic is delegated to `QRCodeDisplay`.
- **Open/Closed (OCP):** `EventFilter` uses a `filterConfig` array, allowing extension without modification.
- **Interface Segregation (ISP):** Wallet hooks are split into specific interfaces (`WalletConnection`, `WalletTransactions`, `WalletBalance`) so components only depend on required methods.

---

### 4.3 Responsive Layout Strategy
- **Mobile-First:** Base styles target 0px+ (bottom nav, single column). Breakpoints scale up to xl (1280px+).
- **Layout Patterns:**
    - **Gate Verifier:** Always single column, optimized for speed.
    - **Student App:** Bottom tab bar on mobile, sidebar on desktop.
    - **Organizer Dashboard:** Data-dense layout with sidebar.

---

### 4.4 Performance & SEO Strategy
- **Performance:**
    - **RSC:** React Server Components for zero-JS static content.
    - **Query Tapping:** React Query caching (StaleTime: 30s/5s).
    - **Optimization:** Next/Image with Cloudinary; Route-based code splitting.
    - **Offline:** Service worker caches QR codes for offline entry.
- **SEO:**
    - **Dynamic Metadata:** `generateMetadata` for event pages with cover images.
    - **Structured Data:** Schema.org/Event JSON-LD for Google search.
    - **Rendering:** SSR for static pages, ISR (300s) for dynamic event pages.

---

### 4.5 Key Animations (Implementation Notes)
- **Ticket QR Flip:** `framer-motion` `rotateY(180deg)` flip on tap.
- **Gate Scan Result:** Full-screen flash overlay (Green/Red) using `opacity` variants.
- **Mint Loading:** Orbit animation with 3 dots and a pulsing central logo.

---

### 4.6 Motion Guidelines
| Interaction | Animation | Duration | Easing |
| :--- | :--- | :--- | :--- |
| **Button Hover** | Scale 1.02 + glow | 150ms | ease-out |
| **Page Change** | Fade + translateY | 200ms | ease-in-out |
| **Modal Open** | Slide up / Fade-scale| 250ms | spring |
