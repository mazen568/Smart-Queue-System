## Smart Queue System — Backend Progress (So Far)

### Overview
- **Built an Express + MongoDB backend** with a clean layered structure
- **Implemented authentication + authorization** using JWT (access + refresh tokens)
- **Introduced multi-tenant boundaries** using `clinicId` (each user belongs to a clinic)

### Project structure 
- **Routing layer**: `routes/authRoutes.js`
  - Defines auth endpoints and wires middleware
- **Controller layer**: `controllers/authController.js`
  - Handles HTTP concerns (cookies, response format) and delegates logic to services
- **Service layer**: `services/authService.js`
  - Contains business logic (register/login/refresh) and DB operations
- **Models**: `models/userModel.js`, `models/clinicModel.js`
  - Mongoose schemas + indexes + password hashing
- **Middlewares**
  - `middlewares/authenticationMiddleware.js`: verifies access token and attaches `req.user`
  - `middlewares/authorizationMiddleware.js`: role-based access control (`authorize(...roles)`)
  - `middlewares/isolateClinicMiddleware.js`: ensures resource belongs to same `clinicId`
  - `middlewares/validationMiddleware.js`: Joi validation for body/params/query
  - `middlewares/errorHandling.js`: centralized error response formatting
- **Helpers**
  - `helpers/generateJWT.js`: token generation helpers
  - `helpers/AppError.js`: typed operational errors with status codes
- **Server entry**: `server.js`
  - Express setup, CORS + cookies, route mounting, MongoDB connection, global error handler

### Implemented Features : 
- **Server bootstrapping**
  - Parses JSON requests
  - Enables `cookie-parser` for refresh-token cookies
  - Configures CORS with `credentials: true` and `origin` from `CLIENT_URL`
  - Connects to MongoDB via `mongoose.connect`
  - Registers a global `errorHandler`

- **Auth endpoints**
  - `POST /api/v1/auth/register`
    - Validates request using Joi schema
    - Creates a new clinic + admin user in a single DB transaction
  - `POST /api/v1/auth/login`
    - Validates request
    - Checks password (bcrypt)
    - Returns user data + access token in JSON
    - Stores refresh token in **httpOnly cookie**
  - `POST /api/v1/auth/refresh`
    - Reads refresh token from cookie
    - Verifies JWT + checks token matches DB
    - Issues a new access token
  - `GET /api/v1/auth/me`
    - Protected route (requires valid access token)
    - Fetches current user by `req.user._id`
  - `POST /api/v1/auth/logout`
    - Protected route
    - Clears refresh token in DB and clears refresh cookie

- **JWT strategy**
  - **Access token**
    - Short-lived (`15m`)
    - Sent via `Authorization: Bearer <token>`
  - **Refresh token**
    - Longer-lived (`7d`)
    - Stored in DB and also set as an **httpOnly cookie**
    - Used to refresh access tokens without re-login

- **Validation & error handling**
  - Joi schemas for login/register (`validations/authValidations.js`)
  - Generic validation middleware that:
    - Returns field-level errors
    - Strips unknown fields
  - `AppError` used to throw consistent errors from services/middlewares
  - Central `errorHandler` returns `{ success, message, details, stack? }`

- **Multi-tenant / clinic isolation groundwork**
  - Users store `clinicId`
  - `isolateClinicMiddleware` checks resource’s `clinicId` matches `req.user.clinicId`
  - `User` schema indexed by `clinicId` for tenant-scoped query efficiency

### Data model work (schemas)
- **Clinic (`models/clinicModel.js`)**
  - Fields: `name` (required), `address` (optional)
  - Index on `name`
- **User (`models/userModel.js`)**
  - Fields: `name`, `email` (unique), `password` (hashed, excluded by default), `role`, `clinicId`, `refreshToken` (excluded by default)
  - Password hashing with `bcrypt` in a `pre("save")` hook
  - Instance method `comparePassword()`
  - Index on `clinicId`

### Approach :
- **Layered separation of concerns**
  - Routes define endpoints + middleware chaining
  - Controllers focus on HTTP behavior (cookies, responses)
  - Services handle business logic + transactions + DB access
  - Models own persistence rules (schema, hashing, indexes)
- **Security-first authentication**
  - Access tokens are short-lived
  - Refresh tokens are stored in an httpOnly cookie and validated against DB
  - Protected routes require `Authorization: Bearer ...`
- **Consistency & maintainability**
  - Reusable middleware for validation, authentication, authorization
  - Centralized error shape via `AppError` + `errorHandler`
- **Tenant-aware design**
  - Clinic is created on registration and associated to the user
  - `clinicId` carried in JWT payload to support clinic scoping in future endpoints

### Current API surface (implemented routes)
- **POST** `/api/v1/auth/register`
- **POST** `/api/v1/auth/login`
- **POST** `/api/v1/auth/refresh`
- **GET** `/api/v1/auth/me`
- **POST** `/api/v1/auth/logout`