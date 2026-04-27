# Smart Queue System (Angular Client) — Progress So Far



## How to run
- `npm start` → runs `ng serve`
- `npm run build` → builds the app
- `npm test` → runs unit tests

## Environments / API base URL
The app uses `environment.apiUrl` as the API base.

- **Development**: `src/environments/environment.development.ts`
  - `apiUrl`: `http://localhost:3000/api/v1`
- **Production**: `src/environments/environment.ts`
  - `apiUrl`: `https://api.yourdomain.com/api/v1` (marked TODO to update)

## App architecture (folders)
Inside `src/app` the current structure includes:

- `features/`
  - `auth/` (login, signup, AuthService)
  - `admin/` (dashboard stub)
  - `reception/` (dashboard stub)
  - `patient/` (clinics stub)
- `core/`
  - `guards/` (`authGuard`, `roleGuard`)
  - `interceptors/` (`authInterceptor`)
- `layouts/`
  - `auth/`, `admin/`, `reception/`, `patient/`
- `shared/`
  - `Components/header`, `footer`, `unauthorized`, `not-found`
- `types/`
  - `user.ts`, `auth.dto.ts`, `forms.ts`

## Routing implemented
Routing is defined in `src/app/app.routes.ts` using standalone components + lazy-loading.

### Public routes
- `/patient`
  - `/patient/clinics` (default child route)
- `/auth`
  - `/auth/login`
  - `/auth/register`
- `/unauthorized`
- `**` (Not Found page)

### Protected + role-restricted routes
- `/admin/*`
  - Protected by `authGuard` and `roleGuard`
  - Allowed roles: `admin`
  - `/admin/dashboard`
- `/reception/*`
  - Protected by `authGuard` and `roleGuard`
  - Allowed roles: `reception`
  - `/reception/dashboard`

## Authentication implemented
Authentication logic lives in `src/app/features/auth/services/auth-service.ts`.

### What exists
- **Login**
  - POST `${apiUrl}/auth/login`
  - On success:
    - stores `user` in a signal
    - stores `accessToken` in a signal
    - persists user to `localStorage` under key `user`
- **Register**
  - POST `${apiUrl}/auth/register`
- **Logout**
  - POST `${apiUrl}/auth/logout`
  - On success:
    - clears user/token signals
    - removes `localStorage` item `user`
- **Refresh token**
  - POST `${apiUrl}/auth/refresh` with `{ withCredentials: true }`
  - Updates access token signal from the API response

### Auth state model
- `User` shape is defined in `src/app/types/user.ts`:
  - `id`, `name`, `email`, `role`, `clinicId`, `accessToken`
- Role currently modeled as: `"admin" | "reception"`

### Forms / DTOs
- `loginForm`, `registerForm` in `src/app/types/forms.ts`
- `UserDTO`, `refreshDTO` in `src/app/types/auth.dto.ts`

## HTTP interceptor (token + refresh-on-401)
An HTTP interceptor is registered in `src/app/app.config.ts` via:

- `provideHttpClient(withInterceptors([authInterceptor]))`

Implemented behavior in `src/app/core/interceptors/auth-interceptor.ts`:

- Adds `withCredentials: true` to API requests (supports cookie-based refresh flow)
- Adds `Authorization: Bearer <token>` to **protected** API requests (non-auth endpoints)
- If a protected request returns `401`:
  - triggers `AuthService.refreshToken()`
  - retries the original request with the new token
  - includes **in-flight refresh deduplication**:
    - concurrent 401s wait on a shared subject and then replay with the refreshed token

## Guards implemented
### `authGuard`
File: `src/app/core/guards/auth-guard.ts`

- Allows navigation if a token exists (token signal or token from stored user)
- Otherwise redirects to `/auth/login` and sets `returnUrl` query param

### `roleGuard`
File: `src/app/core/guards/role-guard.ts`

- Reads allowed roles from route data: `data: { roles: [...] }`
- If roles aren’t provided: allows navigation
- If user is not logged in: redirects to `/auth/login?returnUrl=...`
- If logged in but role is not allowed: redirects to `/unauthorized` with `returnUrl` and `requiredRoles`

## UI work completed so far
### Auth UI
- `Login` component (`features/auth/Components/login`)
  - Reactive form with validation (email + password)
  - Submitting state + server error message handling
  - Redirect after login:
    - `returnUrl` if present
    - otherwise defaults by role:
      - admin → `/admin/dashboard`
      - reception → `/reception/dashboard`
      - otherwise → `/patient/clinics`
- `Signup` component (`features/auth/Components/signup`)
  - Reactive form with validation
  - Custom validator: password/confirm-password match
  - Redirect after signup by role (same mapping)

### Layouts
- `layouts/admin`, `layouts/reception`, `layouts/auth`:
  - contain `RouterOutlet` to render their children
- `layouts/patient`:
  - includes shared `Header` + `RouterOutlet`

### Shared components
- `Header`
  - reads current user from `AuthService`
  - computes dashboard URL + label based on user role
- `Unauthorized` page
  - shows dashboard link / button based on role
- `NotFound` page
- `Footer` component exists

### Feature stubs
- Admin dashboard component exists (currently minimal)
- Reception dashboard component exists (currently minimal)
- Patient clinics component exists (currently minimal)

## Notes / TODO ideas (next steps)
- Connect dashboards/clinics screens to real API endpoints and models
- Decide whether patient role exists (currently roles are only admin/reception)
- Add route protection (if needed) for patient flows (currently patient area is public)
- Consider storing access token separately from user object (or standardize one source)
- Add centralized error handling / toast notifications for API errors
- Add logout UI entry (header button) and clear navigation flow after logout
- Improve production `apiUrl` and add environment management for deployment