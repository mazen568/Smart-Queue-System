# 👤 Member 2 — Full-Stack Engineer (Shawky Ahmad)

## 🎟️ Feature: Patient Experience (Clinic Browse → Ticket → Real-Time Tracking)

> **Goal:** A patient can open the app, browse clinics, pick a doctor, take a ticket, and track their position in the queue in real-time.

---

### 🟦 Backend — Node.js

#### Phase 1 · Models
- [x] **`Clinic` model (read):** reuse M1's Clinic model — added `description`, `address`, `logoUrl` fields.
- [x] **`Queue` model:** `{ clinicId, name, currentNumber, avgServiceTime (mins), isActive, createdAt }`
- [x] **`Ticket` model:** `{ clinicId, queueId, number, status: 'waiting'|'called'|'done'|'cancelled', createdAt }`
- [x] **DB indexes:** `queues.clinicId`, `tickets.queueId`, `tickets.status`, compound `(clinicId, queueId)`
- [x] **Seed script:** 2 sample clinics with professional Unsplash images, 3 queues, 10 tickets.

#### Phase 2 · Clinic & Queue API (Public)
- [x] `GET /api/clinics` — list all active clinics (no auth required).
- [x] `GET /api/clinics/:id` — single clinic detail with its queues embedded.
- [x] `GET /api/queues?clinicId=X` — list queues for a clinic with live stats.
- [x] `GET /api/queues/:id` — single queue with current serving number + waiting count.

#### Phase 3 · Ticket API
- [x] `POST /api/tickets` — create ticket → auto-increment number per queue. Returns `{ id, number, waitTime, position }`.
- [x] `GET /api/tickets/:id` — get ticket status + current position in queue.
- [x] **Waiting time formula:** `waitTime = position × avgServiceTime`.
- [x] `GET /api/tickets/queue/:queueId` — list all waiting tickets.
- [x] `DELETE /api/tickets/:id` — cancel ticket and notify clinic via WebSocket.

#### Phase 4 · WebSocket — Patient Events
- [x] **Initialize Socket.io:** Exported instance for global access.
- [x] **Patient connections:** Automatic join to room `clinic:${clinicId}`.
- [x] **Emit `ticketCreated`:** Broadcast to clinic room on new ticket.
- [x] **Emit `queueUpdated`:** Broadcast updated queue stats on any change.
- [x] **Emit `ticketCalled`:** Broadcast when a ticket is called.
- [x] **Emit `ticketDone`:** Broadcast when a ticket is marked done.
- [x] **Conflict Prevention:** Atomic `findOneAndUpdate` logic for state transitions.
