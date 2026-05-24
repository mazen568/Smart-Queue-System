# 🏥 Smart Queue System (SQS)

> A production-ready, full-stack healthcare queue management platform built by a 5-member team. Eliminates waiting room congestion with real-time digital ticketing, live tracking, staff dashboards, analytics, and an AI-powered patient assistant.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Groq AI](https://img.shields.io/badge/Groq-AI%20Chatbot-F55036?style=for-the-badge&logoColor=white)](https://groq.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-6772E5?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

---

## 🚀 Demo 
[Watch the Features Walkthrough](https://www.linkedin.com/feed/update/urn:li:activity:7458590040777031681/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAE1aXNUB2CqA0P8kKo76E-AOA7XuLXK67Pw)

---

## 🌟 Overview

Smart Queue System is a full-stack multi-tenant SaaS solution for modern medical clinics. It replaces paper tickets with a digital-first approach:

- 🎫 **Virtual Ticketing** — patients take queue spots from their phone
- 📡 **Real-Time Sync** — every staff action reflects instantly on patient screens
- 📺 **Public TV Display** — large-screen waiting room announcements with Text-to-Speech
- 🤖 **AI Assistant** — SmartBot guides patients with live queue data
- 💳 **Billing & Credits** — Stripe-powered credit system for clinic subscriptions
- 📊 **Analytics** — queue performance metrics and peak hour detection

---

## 🎭 User Roles

### 👤 Patient *(Public — No Login Required)*
- **Browse Clinics**: Card grid with imagery, search filtering, empty states
- **Virtual Ticket**: Take a digital ticket — auto-incremented, QR-coded, and persisted to `localStorage`
- **Live Tracker**: Real-time "people ahead" counter and ETA via WebSocket events
- **Status Alerts**: "YOUR TURN" banner + browser push notification when called
- **Smart Departure**: Leave queue with automatic position recalculation for all others
- **🤖 AI SmartBot**: Ask in Arabic or English — ticket status, wait times, clinic info, cancellation

### 💼 Reception / Staff *(Protected — `reception` role)*
- **Queue Grid**: Live view of all doctors, serving counts, and waiting lists
- **Patient Flow Actions**: Call Next, Call Specific, Skip, Mark Done, Recall
- **Keyboard Shortcuts**: Built-in hotkeys for rapid mouse-free operation
- **Audio Engine**: Web Audio API synthesized clinical chimes (not library-dependent)
- **Status Sync**: Every action broadcasts real-time updates via Socket.io

### 👑 Clinic Admin *(Protected — `admin` role)*
- **Clinic Settings**: Update name, address, description, logo, and activation status
- **Queue Management**: Create/edit/soft-delete doctor queues, reset daily counters
- **Staff Management**: Create/delete receptionist accounts, force password resets
- **Overview Dashboard**: Live KPI snapshot — queues, staff, tickets, credits
- **Analytics**: Date-filtered charts for daily ticket trends and peak hours
- **Billing**: Credit balance, package selection, Stripe checkout, payment history

---

## 🚀 Feature Breakdown

### 🔐 Authentication & Security *(Moamen Soltan)*
| Feature | Details |
|---|---|
| Register | Creates clinic + admin user atomically in one DB transaction |
| Login | Returns JWT access token + httpOnly refresh cookie |
| Token Refresh | Deduplicates concurrent 401s — only one refresh call fires |
| Auto-Retry | Angular interceptor retries failed requests after token refresh |
| Role Guards | `authGuard` + `roleGuard` protect all staff routes |
| Multi-Tenant | `clinicId` embedded in JWT, enforced on every query |

### 🎟️ Patient Queue Flow *(Shawky Ahmad)*
| Feature | Details |
|---|---|
| Clinic Browse | Card grid with real-time queue counts and Unsplash imagery |
| Clinic Detail | Hero layout with doctor list and join-queue button |
| Take Ticket | Atomic `findOneAndUpdate` auto-increments ticket number per queue |
| Wait Time Formula | `ETA = position × avgServiceTime` |
| Live Tracker | WebSocket-driven position updates without page refresh |
| QR Code | Auto-generated QR linking to ticket status page |
| Browser Notifications | Asks permission and fires native notification on `ticketCalled` |
| Cancel Ticket | Leaves queue and triggers position recalculation for others |

### 🖥️ Reception Dashboard *(Hassan Abdelhamed)*
| Feature | Details |
|---|---|
| Call Next | FIFO atomic select — lowest ticket number with `status: waiting` |
| Singleton Guard | Rejects with `409` if a ticket is already `called` |
| Call Specific | Target a specific patient — same transaction + singleton guard |
| Skip | Reorders patient to end of queue (no status change) |
| Mark Done | Records `completedAt`, updates rolling average service time in O(1) |
| Recall | Re-emits `ticketCalled` with `isRecall: true` — no DB write |
| Audio Chimes | Web Audio API oscillator nodes synthesize clinical sounds in-browser |
| Queue Stats | `servedToday`, `waitingCount`, `avgServiceTime`, `currentlyServing` |

### 📺 Public TV Display *(Hassan Abdelhamed)*
| Feature | Details |
|---|---|
| 4K-Optimized Layout | CSS `clamp()` + `vw` units — scales to any screen size infinitely |
| Text-to-Speech | Web Speech API announces tickets (e.g., *"Ticket 14, Dr. Smith"*) |
| Autoplay Bypass | Glass overlay forces one user interaction to unlock browser audio |
| Visual Sync | Doctor card pulses with blue glow for 4 seconds on announcement |
| Offline Banner | Red "🔴 LIVE SYNC PAUSED" banner drops on socket disconnect |
| Boot Skeletons | CSS shimmer loaders mask network latency during TV boot |

### 👑 Admin Dashboard *(Mazen Raafat)*
| Feature | Details |
|---|---|
| Clinic Management | Update clinic info, toggle active/inactive status |
| Queue (Doctor) CRUD | Create, edit, soft-delete queues; reset daily ticket counter |
| Staff Management | Create reception accounts, delete staff, force password resets |
| Overview Stats | Real-time aggregated KPIs in a single API call |
| RBAC Enforcement | `isolateClinicMiddleware` prevents cross-clinic data access |

### 💳 Billing & Analytics *(Hassan Muhammad)*
| Feature | Details |
|---|---|
| Credit Balance | Real-time clinic credit balance with Material card display |
| Credit Packages | 3 predefined tiers (50 / 100 / 200 credits) with price-per-credit |
| Stripe Checkout | Secure hosted checkout with session ID tracking |
| Webhook Handler | Idempotent payment confirmation — atomically increments balance |
| Low Credit Warning | Threshold-based banner to prompt timely top-up |
| Payment History | Full transaction audit trail |
| Daily Trends Chart | Time-series ticket volume with date range filter |
| Peak Hours Chart | Hourly heatmap to optimize staffing decisions |

### 🤖 AI Chatbot — SmartBot *(All Team)*
| Capability | Details |
|---|---|
| Ticket by Number | Patient says "#24" → bot uses `get_ticket_by_number` tool to fetch live data |
| Wait Time | Calculates ETA from live queue depth × avg service time |
| Clinic Browsing | Lists all active clinics with queue counts |
| Cancel Ticket | Patient can leave queue directly through the chat |
| Bilingual | Detects and responds in Arabic or English automatically |
| Multi-Turn Memory | Conversation history maintained for contextual follow-ups |
| Function Calling | Model calls DB tools — never hallucinates queue numbers |
| Rate Limiting | 8 req/min per IP to stay within free API tier |
| Auto Retry | Exponential backoff: 15s → 30s → 60s on API rate limits |

**Powered by:** [Groq](https://groq.com/) `llama-3.3-70b-versatile` — free, open-source, fastest inference.

---

## 🛠️ Technical Stack

### Frontend
| Technology | Role |
|---|---|
| **Angular 21** | Standalone components, signals-based reactive state |
| **RxJS** | HTTP streams, WebSocket event handling, interceptor deduplication |
| **Angular Material** | Billing/Analytics UI components |
| **Socket.io Client** | Real-time patient and reception sync |
| **Web Audio API** | Synthesized clinical chimes (no audio file dependencies) |
| **Web Speech API** | TV display text-to-speech announcements |
| **Pulse.clinic CSS** | Custom design system — tokens, glassmorphism, animations |

### Backend
| Technology | Role |
|---|---|
| **Node.js + Express.js** | ES Module REST API server |
| **MongoDB Atlas + Mongoose** | Multi-tenant cloud database with ODM |
| **Socket.io** | Bi-directional real-time event broadcasting |
| **Zod / Joi** | Schema-based request validation |
| **JWT** | Stateless auth — short-lived access + httpOnly refresh tokens |
| **Groq API** | AI inference for SmartBot (`llama-3.3-70b-versatile`) |
| **Stripe** | Checkout sessions, webhook payment confirmation |
| **bcrypt** | Password hashing with `pre('save')` hook |

---

## 📥 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Angular CLI: `npm install -g @angular/cli`
- Groq API Key: [console.groq.com/keys](https://console.groq.com/keys) *(free)*
- Stripe Account: [stripe.com](https://stripe.com) 

### 1. Clone the repository
```bash
git clone https://github.com/MoamenSoltan/Smart-Queue-System.git
cd Smart-Queue-System
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:4200

MONGODB_URL=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/Queue-System

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h

# AI Chatbot — free key from https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_key_here

# Stripe — optional, mock mode works without it
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

```bash
npm run dev
```

> **Windows users:** If you see `querySrv ECONNREFUSED`, the server automatically switches to Google DNS (`8.8.8.8`) on Windows only — no manual action needed.

### 3. Frontend Setup
```bash
cd client
npm install
ng serve
```

Visit `http://localhost:4200` — redirects to `/patient/clinics` by default.

### 4. Seed the Database *(optional)*
```bash
cd server
node scripts/seed.js
```
Populates 2 sample clinics with professional imagery, 3 queues, and 10 tickets.

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Create clinic + admin account |
| `POST` | `/api/v1/auth/login` | Public | Login — returns JWT + sets cookie |
| `POST` | `/api/v1/auth/refresh` | Cookie | Refresh access token |
| `GET` | `/api/v1/auth/me` | Bearer | Get current user |
| `POST` | `/api/v1/auth/logout` | Bearer | Clear tokens |

### Patient *(Public)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/patient/clinics` | List all active clinics |
| `GET` | `/api/v1/patient/clinic/:id` | Clinic detail + queues |
| `POST` | `/api/v1/patient/ticket` | Join queue, get ticket |
| `GET` | `/api/v1/patient/ticket/:id` | Live ticket status + position |
| `DELETE` | `/api/v1/patient/ticket/:id` | Cancel ticket |

### Chatbot *(Public)*
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chatbot/message` | Send message to SmartBot |

```json
// Request
{ "message": "What is my wait time for ticket #24?", "history": [] }

// Response
{ "reply": "You are #3 in queue. Estimated wait: 12 minutes.", "history": [...] }
```

> Rate limited: **8 requests/minute per IP**

### Reception *(Protected: `reception` or `admin`)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/reception/queues` | All queues with live stats |
| `GET` | `/api/v1/reception/queues/:id/tickets` | Queue ticket list (FIFO) |
| `GET` | `/api/v1/reception/queues/:id/stats` | Performance stats |
| `POST` | `/api/v1/reception/queues/:id/call-next` | Call next patient |
| `PATCH` | `/api/v1/reception/tickets/:id/call` | Call specific ticket |
| `PATCH` | `/api/v1/reception/tickets/:id/done` | Mark ticket complete |
| `PATCH` | `/api/v1/reception/tickets/:id/skip` | Move patient to end of queue |
| `PATCH` | `/api/v1/reception/tickets/:id/recall` | Re-announce without DB write |

### Admin *(Protected: `admin`)*
| Method | Endpoint | Description |
|---|---|---|
| `GET/PUT` | `/api/v1/admin/clinic` | Get/update clinic info |
| `PATCH` | `/api/v1/admin/clinic/status` | Toggle clinic active state |
| `GET/POST` | `/api/v1/admin/queues` | List / create queues |
| `PUT/DELETE` | `/api/v1/admin/queues/:id` | Edit / soft-delete queue |
| `PATCH` | `/api/v1/admin/queues/:id/reset` | Reset daily ticket counter |
| `GET/POST` | `/api/v1/admin/staff` | List / create staff |
| `DELETE` | `/api/v1/admin/staff/:id` | Remove staff account |
| `PATCH` | `/api/v1/admin/staff/:id/reset-password` | Force password reset |
| `GET` | `/api/v1/admin/overview` | Live KPI dashboard |

### Billing & Analytics *(Protected: `admin`)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/credits/balance` | Current credit balance |
| `GET` | `/api/v1/payments/packages` | Available credit packages |
| `POST` | `/api/v1/payments/checkout` | Create Stripe checkout session |
| `POST` | `/api/v1/webhooks/stripe` | Stripe payment webhook |
| `GET` | `/api/v1/analytics/metrics` | Date-range analytics data |
| `GET` | `/api/v1/analytics/overview` | KPI snapshot |

---

## 📡 WebSocket Events

All events are scoped to room `clinic:${clinicId}`.

| Event | Emitted By | Key Payload |
|---|---|---|
| `ticketCreated` | Patient joins queue | `ticketId`, `number`, `queueId` |
| `ticketCalled` | Reception calls next/specific | `ticketId`, `number`, `isRecall?` |
| `ticketDone` | Reception marks complete | `ticketId`, `completedAt` |
| `queueUpdated` | Any queue mutation | `queueId`, `waitingCount`, `currentlyServing` |
| `balanceUpdated` | Payment webhook confirmed | `clinicId`, `newBalance` |

> **Post-Commit Rule**: Events fire only after DB transaction commits — no duplicate events on retry.

---

## 🗂️ Project Structure

```
smart-queue-system/
├── client/                          # Angular 21 frontend
│   └── src/app/
│       ├── core/
│       │   ├── guards/              # authGuard, roleGuard
│       │   ├── interceptors/        # authInterceptor (token + 401 retry)
│       │   └── services/            # AuthService, SocketService, ChatbotService
│       ├── features/
│       │   ├── auth/                # Login, Signup
│       │   ├── patient/             # Clinics, ClinicDetail, TicketTracker
│       │   ├── admin/               # Dashboard, Queues, Staff, Settings
│       │   ├── reception/           # Dashboard, QueueControl, PublicDisplay
│       │   ├── billing/             # BillingPage, CreditBalance, PurchaseCredits
│       │   └── analytics/           # AnalyticsPage, Charts, DateRangePicker
│       ├── layouts/                 # Page shells (patient, admin, auth, reception)
│       └── shared/
│           ├── chatbot/             # 🤖 SmartBot floating widget
│           ├── header/              # Role-aware navigation header
│           └── Components/          # Toasts, Modal, NotFound, Unauthorized
│
└── server/                          # Express.js backend (ES Modules)
    ├── controllers/                 # Thin HTTP layer — delegates to services
    ├── models/                      # Mongoose schemas + indexes
    │   ├── clinicModel.js
    │   ├── queueModel.js            # totalServedCount, rolling avg
    │   ├── ticketModel.js           # FIFO indexes, unique (queueId, number)
    │   ├── userModel.js             # bcrypt pre-save, comparePassword()
    │   ├── creditsModel.js
    │   └── paymentModel.js
    ├── routes/                      # Express routers
    ├── services/
    │   ├── chatbotService.js        # 🤖 Groq AI + function calling agentic loop
    │   ├── receptionService.js      # Queue invariants + transactions
    │   ├── ticketService.js         # Position + ETA calculation
    │   ├── authService.js           # JWT + refresh token management
    │   ├── billingService.js        # Credit ledger + Stripe sessions
    │   ├── analyticsService.js      # Aggregation pipeline for metrics
    │   └── eventService.js          # Centralized Socket.io post-commit emitter
    ├── middlewares/                 # auth, authorize, isolateClinic, validation, errors
    ├── validations/                 # Zod / Joi schemas per route
    ├── helpers/                     # AppError, generateJWT
    └── server.js                   # Entry point
```

---

## 🎨 Design System — Pulse.clinic

All UI uses a consistent design token system defined in `client/src/styles.css`:

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#3B82F6` | Primary buttons, links, borders-on-focus |
| `--background` | `#F8F8F9` | Page background |
| `--surface` | `#FFFFFF` | Cards, modals, chat bubbles |
| `--border` | `#EAEAEA` | Dividers, input borders |
| `--foreground` | `#111111` | Body text |
| `--muted-foreground` | `#6B6B6B` | Captions, placeholders |
| `--success / --warning / --danger` | `#2EB872 / #F59E0B / #E5484D` | Status badges |
| `--font-family` | `Outfit` (Google Fonts) | All typography |
| `--radius-full` | `60px` | Pills, avatars, FAB buttons |
| `--shadow-glow` | Blue glow shadow | Accent elements |
| `--gradient-accent` | `135deg, #3B82F6, #60A5FA` | Buttons, chat header, FAB |

**Animations available**: `fade-in`, `fade-in-up`, `scale-in`, `slide-in`, `pulse-soft`, `shimmer`

---

## 👥 Team

| Member | Role | Responsibilities |
|---|---|---|
| **Moamen Soltan** | Full-Stack | Auth system, app architecture |
| **Shawky Ahmad** | Full-Stack | Patient flow — clinic browse, ticketing, real-time tracker |
| **Hassan Abdelhamed** | Full-Stack | Reception dashboard, queue control, Public TV display |
| **Mazen Raafat** | Full-Stack | Admin dashboard — clinic, queue, and staff management |
| **Hassan Muhammad** | Full-Stack | Billing system, Stripe integration, analytics dashboards |


---

## 📄 License

© 2026 Smart Queue System Team. Production-ready for healthcare queue management. All rights reserved.
