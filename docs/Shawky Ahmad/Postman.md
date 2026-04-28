## 📡 Smart Queue System — Postman Documentation (Shawky Ahmad)

### 🚀 Collection Summary
This collection provides rigorous validation for the **Patient Journey API**. It covers discovery, stateful ticketing, and lifecycle management.

### 🏠 Base URL: `{{apiUrl}}/patient`

---

### 📂 Endpoints

#### 1. `GET /clinics` [Public Discovery]
- **Description**: Fetches all active clinics with aggregated queue counts.
- **Success**: `200 OK` (Array of clinics with `activeQueuesCount`).

#### 2. `GET /clinics/:id` [Clinic Dossier]
- **Description**: Detailed profile of a clinic including all active doctor queues.
- **Param**: `id` (Clinic MongoDB ID).
- **Success**: `200 OK` (Includes clinic info and `queues` array with wait times).

#### 3. `POST /tickets` [Issue Ticket]
- **Description**: Issues a new ticket for a specific doctor.
- **Body**: `{ clinicId, queueId, customerName? }`.
- **Success**: `201 Created` (Returns ticket number, position, and tracking ID).

#### 4. `GET /tickets/:id` [Live Tracker]
- **Description**: Real-time status retrieval for a specific ticket.
- **Success**: `200 OK` (Returns status, current position, and live ETA).

#### 5. `DELETE /tickets/:id` [Leave Queue]
- **Description**: Atomically voids a ticket and triggers a system-wide queue recalculation.
- **Success**: `200 OK` (Confirmation of cancellation).

---

### 🧪 Global Variables
- `apiUrl`: `http://localhost:3000/api/v1`
- `activeTicketId`: (Dynamic storage for sequential testing)
