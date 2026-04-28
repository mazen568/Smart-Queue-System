## Smart Queue System — Reception Queue Control Backend (Hassan Abdelhamed)

### Overview
- **Implemented the Reception Dashboard Backend slice** (Member 3 role)
- **Built production-grade queue control APIs** with transaction-level consistency
- **Enforced system invariants** (Singleton Active Ticket, FIFO ordering, multi-tenant isolation)
- **Integrated real-time Socket.io events** via centralized Event Service
- **Designed rolling average analytics** for O(1) performance metrics

### Project Structure (Files Owned)
- **Routing layer**: `routes/receptionRoutes.js`
  - Defines 8 reception endpoints for queue reads, ticket actions, and stats
  - Protected by `authenticate` + `authorize('reception', 'admin')`
- **Controller layer**: `controllers/receptionController.js`
  - Thin HTTP layer — extracts `clinicId` from JWT, delegates to service
  - Idempotent `markDone` handler (returns 200 if ticket already completed)
- **Service layer**: `services/receptionService.js`
  - All business logic centralized here (the "brain")
  - Mongoose transactions for multi-document consistency
  - Outer variable pattern for `withTransaction` return value safety
- **Event layer**: `services/eventService.js`
  - Centralized Socket.io emitter for post-commit event broadcasting
  - All events scoped to `clinic:${clinicId}` room
- **Validations**: `validations/receptionValidations.js`
  - Zod schemas for ObjectId params and request bodies
- **Model contributions**:
  - `models/queueModel.js`: Added `totalServedCount` field + `{ clinicId, isActive }` compound index
  - `models/ticketModel.js`: Added `{ queueId, status, number }` index + `{ queueId, number }` unique constraint

### System Design & Architecture

#### Core Invariants (Enforced at DB + Service Level)
1. **Singleton Active Rule**: At most ONE ticket with `status: 'called'` per queue at any time
   - Enforced via `findOne({ status: 'called' })` guard inside a Mongoose transaction
   - Prevents race conditions where two concurrent requests could call two tickets
2. **FIFO Ordering**: Tickets are served by ascending `number`, not `createdAt`
   - `findOneAndUpdate` with `sort: { number: 1 }` ensures deterministic ordering
   - `skip` re-assigns `number` to move a ticket to the end of the line
3. **Multi-Tenant Isolation**: Every query includes `clinicId` from the JWT payload
   - A receptionist cannot operate on tickets/queues from another clinic
4. **Lifecycle Enforcement**: Status transitions are guarded at the query level
   - `waiting → called` (via call-next or call-specific)
   - `called → done` (via mark-done)
   - `skip` = re-order within `waiting` (no status change)

#### Three-Layer Protection Model
- **Level 1 (Query Level)**: Filters like `status: 'waiting'` in `findOneAndUpdate`
- **Level 2 (Service Level)**: Explicit guard clauses (`if (alreadyCalled) throw`)
- **Level 3 (Transaction Level)**: Mongoose sessions ensure "all or nothing" commits

#### Derived State Pattern
- "Currently serving" is derived from `Ticket where status = 'called'`, NOT stored on the Queue model
- `currentNumber` on Queue = last issued ticket number (M2's convention, not "serving number")
- This eliminates redundant state and prevents inconsistency

### Features Implemented

#### 1. Queue Overview [Read]
- **List Queues**: `GET /api/v1/reception/queues`
  - Returns all active queues for the clinic with live `waitingCount` and `estimatedWaitTime`
  - Uses MongoDB aggregation pipeline for efficient per-queue ticket counting
  - O(1) merge via `Map` lookup (not O(n²) array search)

#### 2. Ticket List [Read]
- **Get Tickets**: `GET /api/v1/reception/queues/:queueId/tickets`
  - Returns all `waiting` + `called` tickets, sorted by `number` (FIFO)
  - Includes `calledTicket`, `nextTicket`, `waitingCount`, and `totalTickets`
  - Uses `.lean()` for read-only performance optimization

#### 3. Call Next Ticket [Transaction]
- **Call Next**: `POST /api/v1/reception/queues/:queueId/call-next`
  - Atomic FIFO select: finds the lowest `number` ticket with `status: 'waiting'`
  - Singleton guard: rejects with `409` if a ticket is already `called`
  - Transaction: both the singleton check and the update are in the same session
  - Post-commit: emits `ticketCalled` + `queueUpdated` via Socket.io

#### 4. Call Specific Ticket [Transaction]
- **Call Specific**: `PATCH /api/v1/reception/tickets/:id/call`
  - Body: `{ "queueId": "..." }`
  - Same singleton guard + transaction as call-next
  - Uses atomic `findOneAndUpdate` instead of find + save (no race window)
  - Validates ticket belongs to the specified queue AND the user's clinic

#### 5. Mark Ticket Done [Transaction + Analytics]
- **Mark Done**: `PATCH /api/v1/reception/tickets/:id/done`
  - Marks `called → done` with `completedAt` timestamp
  - Preserves `calledAt` (needed for service time calculation)
  - Safety check: validates `calledAt` exists to prevent NaN in average
  - **Rolling Average (O(1))**: `newAvg = (oldAvg × oldCount + serviceTime) / (oldCount + 1)`
    - Updates `Queue.avgServiceTime` and `$inc: { totalServedCount: 1 }` atomically
    - Unit: minutes, rounded to 2 decimal places
  - All operations in a single transaction (ticket update + queue stats update)
  - **Idempotent**: calling done on an already-done ticket returns `200 OK` (handles frontend retries)

#### 6. Skip Ticket [Transaction]
- **Skip**: `PATCH /api/v1/reception/tickets/:id/skip`
  - Body: `{ "queueId": "..." }`
  - Only works on `waiting` tickets (cannot skip a `called` ticket)
  - Increments `Queue.currentNumber` (M2's monotonic counter) atomically via `$inc`
  - Re-assigns the ticket's `number` to the new counter value (moves to end of line)
  - Status remains `waiting` — skip is a reordering operation, not a state change
  - Post-commit: emits `queueUpdated` so patients see their new position

#### 7. Recall Ticket [No DB Change]
- **Recall**: `PATCH /api/v1/reception/tickets/:id/recall`
  - Pure UX operation — patient didn't hear the first announcement
  - No database mutation (no transaction needed)
  - Re-emits `ticketCalled` event with `isRecall: true` flag
  - Frontend can use the flag to play a different sound or flash the screen

#### 8. Queue Stats [Read]
- **Get Stats**: `GET /api/v1/reception/queues/:queueId/stats`
  - Returns: `name`, `avgServiceTime`, `waitingCount`, `servedToday`, `currentlyServing`, `estimatedWaitTime`
  - `servedToday` uses `completedAt >= midnight` filter
  - `currentlyServing` derived from active `called` ticket (not stored field)
  - Uses `Promise.all` for parallel count queries

### Socket.io Event Contract

#### Events Emitted (Post-Commit Only)
| Event | When | Key Payload Fields |
|-------|------|--------------------|
| `ticketCalled` | callNext / callSpecific / recall | `ticketId`, `number`, `queueId`, `clinicId`, `calledAt` |
| `ticketDone` | markDone | `ticketId`, `number`, `queueId`, `clinicId`, `completedAt` |
| `queueUpdated` | Any queue mutation | `queueId`, `clinicId`, `waitingCount`, `currentlyServing` |

#### Emission Pattern
- Events fire **only after** the database transaction commits (Post-Commit Rule)
- If transaction fails/retries, no duplicate events are emitted
- All events broadcast to Socket room `clinic:${clinicId}`

#### Coordination with M2 (Shawky)
- M2 emits `ticketCreated` and `queueUpdated` from patient ticket creation
- M3 emits `ticketCalled`, `ticketDone`, and `queueUpdated` from reception actions
- Both emit to the same room — frontend listens and reacts to any event

### Engineering Approach

- **Service-Oriented Architecture**
  - Controllers are "dumb" — no business logic, no DB queries
  - All invariant enforcement lives in `receptionService.js`
  - If a CLI or cron job needs to call-next, it calls the service directly
- **Transaction Safety**
  - `try/finally` pattern ensures `session.endSession()` runs even on errors
  - Outer variable pattern avoids MongoDB `withTransaction` return value risk
- **Performance Decisions**
  - `.lean()` on all read queries (~3x faster, no Mongoose hydration)
  - `Map` lookup for aggregation merge (O(1) vs O(n²))
  - Rolling average avoids O(n) aggregation on every done operation
  - `Promise.all` for parallel independent count queries
- **Team Compatibility**
  - Accepted M2's `currentNumber` as "last issued ticket number"
  - Did not break M4's admin ticket operations
  - Shared event room convention `clinic:${clinicId}`
- **Express 5 Error Handling**
  - No `try/catch/next` in controllers (Express 5 auto-forwards async errors)
  - Only `markDone` has a catch block for intentional idempotency logic

### Data Model Contributions

#### Queue Model (`models/queueModel.js`)
- **Added field**: `totalServedCount` (Number, default 0)
  - Powers O(1) rolling average calculation
- **Added index**: `{ clinicId: 1, isActive: 1 }`
  - Optimizes "get active queues for clinic" dashboard query

#### Ticket Model (`models/ticketModel.js`)
- **Added index**: `{ queueId: 1, status: 1, number: 1 }`
  - Covers the call-next query: find waiting tickets sorted by number
- **Added unique index**: `{ queueId: 1, number: 1 }`
  - Database-level invariant: prevents duplicate ticket numbers per queue

### Current API Surface (Reception Dashboard)
- **GET** `/api/v1/reception/queues`
- **GET** `/api/v1/reception/queues/:queueId/tickets`
- **GET** `/api/v1/reception/queues/:queueId/stats`
- **POST** `/api/v1/reception/queues/:queueId/call-next`
- **PATCH** `/api/v1/reception/tickets/:id/call`
- **PATCH** `/api/v1/reception/tickets/:id/done`
- **PATCH** `/api/v1/reception/tickets/:id/skip`
- **PATCH** `/api/v1/reception/tickets/:id/recall`

### Testing
- Postman collection available at: `docs/Hassan Abdelhamed/postman/Reception_API_Collection.json`
  - 17 requests covering all endpoints + invariant tests + edge cases
  - Auto-populates JWT token, queueId, and ticketId via test scripts
  - Validates: 409 on double-call, idempotent done, skip re-numbering, analytics updates
