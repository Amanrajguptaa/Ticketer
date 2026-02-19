# AGENT 02: DESIGN SYSTEM
## Brand Identity · Visual Language · UI Aesthetic

### 2.1 Design Philosophy
**TicketChain** is inspired by **District** (dark, electric) and **Zero1 by Zerodha** (data-dense, trust-first). 
- **Aesthetic:** Dark-first, neon-accented, information-dense but breathable.
- **Vibe:** "Concert poster meets fintech dashboard."
- **Goal:** Premium and technical, but accessible to Gen Z.

---

### 2.2 Color System
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--color-bg-primary` | `#0A0A0F` | Main background — near black |
| `--color-bg-surface` | `#13131A` | Cards, panels, modals |
| `--color-bg-raised` | `#1E1E2E` | Hover states, active panels |
| `--color-brand-violet` | `#6C47FF` | Primary CTA, active states, links |
| `--color-brand-teal` | `#00D4AA` | Success, verified, confirmed |
| `--color-brand-coral` | `#FF6B35` | Warnings, limited availability |
| `--color-text-primary` | `#F1F1F5` | Headings, key labels |
| `--color-text-secondary` | `#8B8B9E` | Body text, metadata |
| `--color-text-muted` | `#4A4A5E` | Placeholder, disabled |
| `--color-border` | `#2A2A3E` | Card outlines, dividers |
| `--color-glow-violet` | `#6C47FF40` | Glow effects on primary buttons |

---

### 2.3 Typography Scale
| Scale Name | Font | Size | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-2xl` | Space Grotesk | 72px / 4.5rem | 800 | Landing hero only |
| `display-xl` | Space Grotesk | 56px / 3.5rem | 700 | Page hero headings |
| `heading-xl` | Space Grotesk | 32px / 2rem | 600 | Card titles, headers |
| `heading-lg` | Space Grotesk | 24px / 1.5rem | 600 | Sub-section titles |
| `body-lg` | Inter | 18px / 1.125rem | 400 | Primary body text |
| `body-md` | Inter | 16px / 1rem | 400 | Standard descriptions |
| `label` | Inter | 12px / 0.75rem | 600 | Uppercase badges |
| `mono` | JetBrains Mono | 14px / 0.875rem | 400 | Wallet addresses, IDs |

---

### 2.4 Component Design Spec

#### Button System
| Variant | Background | Text | Border | Hover Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `#6C47FF` | `#FFFFFF` | None | Box shadow glow, scale 1.02 |
| **Secondary** | Transp. | `#6C47FF` | 1px Solid | Bg: `#6C47FF15` |
| **Danger** | `#FF6B35` | `#FFFFFF` | None | Box shadow coral glow |
| **Success** | `#00D4AA` | `#0A0A0F` | None | Box shadow teal glow |

#### Ticket NFT Card (380px × 200px)
- **Background:** Gradient (#1E1E2E to #0A0A0F) with noise texture.
- **Accents:** 4px vertical violet bar on left.
- **Elements:** Event name (HLG), Venue/Date (BSM), QR code (80px with glow), Ticket # (Mono).
- **Status Badges:** `AVAILABLE` (Teal), `USED` (Muted), `TRANSFERRED` (Coral).
- **Interactions:** Lifts 4px on hover, desaturated with diagonal "USED" watermark when spent.

#### Event Card
- **Layout:** Grid item (16:9 aspect ratio cover image).
- **Elements:** Category pill, Title (HLG), Date/Location icons, Price badge (Violet pill).
- **Progress:** Tickets remaining bar (turns coral when <20%).
- **CTA:** Full-width Primary button.

---

### 2.5 Screen-by-Screen Direction
1. **Landing Page:** Animated gradient orbs, large headlines, 3-step "How It Works", pulses/counters for social proof.
2. **Organizer Dashboard:** Metric cards (Sold, Revenue, Scans), Line chart (Sales history), Multi-step event creation drawer.
3. **Student App (Mobile-First):** Bottom nav (Explore, My Tickets, Activity, Profile), Card flip animation for QR reveal.
4. **Gate Verifier:** viewfinder (70% height), full-screen color flash (Green/Red), audio feedback (Beep).

---

### 2.6 Motion & Micro-interactions
| Interaction | Animation | Duration | Easing |
| :--- | :--- | :--- | :--- |
| **Button Hover** | Scale 1.02 + glow | 150ms | ease-out |
| **Ticket Flip** | rotateY(180deg) | 400ms | cubic-bezier |
| **Scan Flash** | Full-screen fade | 1200ms | ease-in-out |
| **Stats Counter**| Animate from 0 | 800ms | ease-out |
| **Skeleton** | Left-to-right shim.| Loop | ease-in-out |

---

### 2.7 Design References
- **District.io:** Editorial event cards, dark UI.
- **Zero1:** Data density, trust signals.
- **Linear.app:** Motion standards, subtle animations.
- **Feverup.com:** Ticket purchase flows.
