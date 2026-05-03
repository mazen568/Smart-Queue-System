# Smart Queue System — Backend Implementation (Hassan Muhammad)

### Overview
- **Implemented Billing & Analytics backend services**
- **Built production-grade credit management system**
- **Integrated Stripe payment processing**
- **Real-time analytics data pipeline**

### Project Structure (Files Owned)
- **Service layer**:
  - `services/billingService.js` - Credit balance, package management, analytics
  - `services/analyticsService.js` - Queue analytics, performance metrics
  - `services/eventService.js` - Real-time event broadcasting

- **Controller layer**:
  - `controllers/billingController.js` - Billing API endpoints (get balance, create checkout)
  - `controllers/analyticsController.js` - Analytics data retrieval

- **Routes**:
  - `routes/creditsRoutes.js` - Credit endpoints
  - `routes/paymentRoutes.js` - Payment/checkout endpoints

- **Validations**:
  - `validations/paymentValidations.js` - Payment validation schemas (Zod)

- **Model contributions**:
  - `models/creditsModel.js`: Clinic credit ledger and balance tracking
  - `models/paymentModel.js`: Payment transaction history
  - `models/subscriptionModel.js`: Subscription/package definitions

### System Design & Architecture

#### Core Features & Invariants

- **Credit System**:
  - Clinic-scoped credit balance tracking
  - Atomic increment/decrement operations with transaction support
  - Payment-to-credit mapping (e.g., 100 EGP = X credits)
  - Audit trail with timestamps and user identification

- **Multi-Tenant Isolation**:
  - Every query includes `clinicId` from JWT payload
  - Cross-clinic data leakage prevention via query filters
  - Role-based access control (admin vs reception vs patient)

- **Stripe Integration**:
  - Secure checkout session creation
  - Mock checkout mode for testing
  - Session ID tracking for post-payment reconciliation
  - Webhook handling for payment confirmation

#### Data Consistency & Safety

- **Transaction Management**: Mongoose sessions for multi-document consistency
- **Atomic Operations**: `$inc` for credit adjustments, no race conditions
- **Validation Layer**: Zod schemas for payment amounts and credit calculations
- **Error Handling**: Proper HTTP status codes (400 validation, 409 conflict, 500 server error)

### Features Implemented

#### 1. Get Credit Balance [Read]
- **Endpoint**: `GET /api/v1/credits/balance`
  - Returns current clinic credit balance
  - Calculated as sum of all credit transactions
  - Response: `{ balance: number }`
  - Performance: O(1) via indexed query or cached value
  - Authentication: Required (extracts clinicId from JWT)

#### 2. Get Available Packages [Read]
- **Endpoint**: `GET /api/v1/payments/packages`
  - Lists all available credit packages (50, 100, 200 credits)
  - Returns package details: credits, price, price-per-credit calculation
  - Performance: Cached (static/infrequent changes)
  - No authentication required (public endpoint)

#### 3. Create Stripe Checkout Session [Transaction]
- **Endpoint**: `POST /api/v1/payments/checkout`
  - Body: `{ "credits": 50 | 100 | 200 }`
  - Creates Stripe checkout session (or mock session in dev)
  - Validates credit package exists
  - Stores session data for webhook reconciliation
  - Response: `{ checkoutUrl: string, sessionId: string }`
  - Error handling: 400 if invalid credits, 500 if Stripe API fails
  - Authentication: Required

#### 4. Payment Webhook [Async]
- **Endpoint**: `POST /api/v1/webhooks/stripe` (or similar)
  - Listens for Stripe `payment_intent.succeeded` events
  - Verifies webhook signature for security
  - Atomically increments clinic balance by purchased credits
  - Creates payment transaction record
  - Broadcasts socket event for real-time balance update
  - Idempotent: duplicate events handled gracefully

#### 5. Get Analytics Metrics [Read]
- **Endpoint**: `GET /api/v1/analytics/metrics?from=DATE&to=DATE`
  - Date range filtering for analytics period
  - Aggregates per-clinic metrics:
    - Total tickets served in period
    - Hourly breakdown (peak hours identification)
    - Daily trends
  - MongoDB aggregation pipeline for efficiency
  - Response: `{ dailyStats: [...], hourlyStats: [...], overview: {...} }`
  - Authentication: Required

#### 6. Get Overview Stats [Read]
- **Endpoint**: `GET /api/v1/analytics/overview`
  - Key performance indicators snapshot
  - Includes: total served, avg service time, current queue depth
  - Real-time calculation or cached with TTL
  - Response: Aggregated metrics object

---

### Performance & Optimization

- **Database Queries**:
  - Indexed fields: `clinicId`, `{ clinicId, date }` for range queries
  - Lean operations for read-only data
  - Aggregation pipeline for complex analytics

- **Caching Strategy**:
  - Package list cached in memory or Redis
  - Balance calculation: either cached or O(1) query via indexed sum
  - Analytics: computed on-demand or pre-calculated nightly

- **Real-time Sync**:
  - Socket.io events after successful payment
  - Rooms scoped to `clinic:${clinicId}`
  - Event: `creditBalance` updated, `balanceUpdated` broadcast

---

### Testing & Validation

- **Postman Collection**: Full test flow from checkout to webhook
- **Known Edge Cases**:
  - Duplicate webhook events (idempotent handling)
  - Mock checkout mode for development without Stripe
  - Concurrent payment requests (transaction isolation)
  - Network failures during payment (retry logic with session ID)

---

**Note:** For detailed API request/response examples, see `postman/API_Collection.json`
