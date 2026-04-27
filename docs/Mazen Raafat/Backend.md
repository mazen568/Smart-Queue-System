## Smart Queue System — Admin Dashboard Backend (Mazen Raafat)

### Overview
- **Implemented the Admin Dashboard Backend slice** (Member 4 role) 
- **Built secure management APIs** for Clinics, Queues (Doctors), and Staff
- **Enforced multi-tenant isolation** using `isolateClinicMiddleware` and JWT-based clinic identification
- **Integrated role-based access control** (RBAC) to restrict access to ADMIN users only

### Project Structure (Phase implementation)
- **Routing layer**: `routes/adminRoutes.js`
  - Defines admin-only endpoints for clinic, queue, and staff management
- **Controller layer**: `controllers/adminController.js`
  - Handles business logic for admin operations, CRUD actions, and stats aggregation
- **Models Used/Created**:
  - `models/clinicModel.js`: Updated with `description`, `logoUrl`, and `isActive`
  - `models/queueModel.js`: **[NEW]** Created for doctor/queue management
  - `models/userModel.js`: Used for reception staff management

### Features Implemented

#### 1. Clinic Management [Phase 1]
- **Fetch Details**: `GET /api/v1/admin/clinic` (Reads data for the logged-in admin's clinic)
- **Update Info**: `PUT /api/v1/admin/clinic` (Supports updating name, address, description, and logo)
- **Status Control**: `PATCH /api/v1/admin/clinic/status` (Toggle clinic activation state)

#### 2. Queue (Doctor) Management [Phase 2]
- **Create Queue**: `POST /api/v1/admin/queues` (Dynamically adds doctors/queues to the clinic)
- **List Queues**: `GET /api/v1/admin/queues` (Fetches all active queues for the current clinic)
- **Edit Queue**: `PUT /api/v1/admin/queues/:id` (Update doctor name or avg service time)
- **Delete Queue**: `DELETE /api/v1/admin/queues/:id` (Soft-delete via `isActive: false`)
- **Reset Counter**: `PATCH /api/v1/admin/queues/:id/reset` (Resets queue numbering for the day)

#### 3. Staff Management [Phase 3]
- **Create Staff**: `POST /api/v1/admin/staff` (Generates a `reception` account linked to the admin's clinic)
- **List Staff**: `GET /api/v1/admin/staff` (Displays all receptionists for the clinic)
- **Delete Staff**: `DELETE /api/v1/admin/staff/:id` (Removes staff account access)
- **Password Reset**: `PATCH /api/v1/admin/staff/:id/reset-password` (Admin-forced password update)

#### 4. Overview Stats Dashboard [Phase 4]
- **Aggregation**: `GET /api/v1/admin/overview`
  - Real-time counts for Queues and Staff
  - Placeholders for Tickets and Credits (to be integrated with M2/M5 work)

### Engineering Approach

- **Security & RBAC**
  - All routes are protected by `authenticate` and `authorize("admin")`
  - Admin cannot manage staff or queues of another clinic (enforced via `isolateClinicMiddleware`)
- **Layered Logic**
  - Clean separation between route definitions and business logic in the controller
  - Centralized error handling via `AppError` and the global error middleware
- **Atomic Operations**
  - Clinic and Queue operations use `findByIdAndUpdate` with `runValidators: true` to ensure data integrity

### Current API Surface (Admin Dashboard)
- **GET** `/api/v1/admin/clinic`
- **PUT** `/api/v1/admin/clinic`
- **PATCH** `/api/v1/admin/clinic/status`
- **POST** `/api/v1/admin/queues`
- **GET** `/api/v1/admin/queues`
- **PUT** `/api/v1/admin/queues/:id`
- **DELETE** `/api/v1/admin/queues/:id`
- **PATCH** `/api/v1/admin/queues/:id/reset`
- **POST** `/api/v1/admin/staff`
- **GET** `/api/v1/admin/staff`
- **DELETE** `/api/v1/admin/staff/:id`
- **PATCH** `/api/v1/admin/staff/:id/reset-password`
- **GET** `/api/v1/admin/overview`
