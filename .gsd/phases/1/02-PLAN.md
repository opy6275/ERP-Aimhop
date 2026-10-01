---
phase: 1
plan: 2
wave: 2
depends_on: [1]
---

# Plan 1.2: Authentication & RBAC Verification

## Objective
Verify the end-to-end authentication lifecycle, HMAC cookie session generation and decoding, role-based page redirects (`/admin/*` vs `/app/*`), and server-side RBAC scoping on API routes (`/api/v1/admin/*` vs `/api/v1/me/*`).

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- src/middleware.ts
- src/lib/session.ts
- src/lib/auth.ts
- src/lib/rbac.ts
- src/app/api/v1/auth/login/route.ts
- src/app/api/v1/auth/me/route.ts

## Tasks

<task type="auto">
  <name>Validate Authentication Logic and Session Issuance</name>
  <files>src/lib/auth.ts, src/lib/session.ts, src/app/api/v1/auth/login/route.ts</files>
  <action>
    - Create an integration test script that validates password comparison via bcryptjs against seeded credentials.
    - Validate that `encodeSession` creates a valid signed HMAC session token and `decodeSession` restores the user ID, email, role, and staffId accurately.
    - Test invalid credential handling (wrong password, inactive user) to ensure correct error codes are returned.
  </action>
  <verify>node scripts/test-auth-session.js</verify>
  <done>Session encoding and decoding roundtrip passes, bcrypt verification succeeds for seeded accounts, and failed logins are rejected.</done>
</task>

<task type="auto">
  <name>Validate Route Protection and Middleware Guards</name>
  <files>src/middleware.ts, src/lib/domain.ts</files>
  <action>
    - Validate middleware rules:
      - Unauthenticated access to `/admin/*` redirects to `/login`.
      - Staff role attempting to access `/admin/*` redirects to `/app/dashboard`.
      - Staff role accessing `/api/v1/admin/*` receives 403 Forbidden.
      - Staff accessing `/api/v1/me/*` receives scoped data restricted to their own staffId.
    - Add automated script to simulate request headers/cookies against middleware/handlers.
  </action>
  <verify>node scripts/test-rbac-guards.js</verify>
  <done>Middleware security rules verified with automated script covering unauthenticated, staff, and admin access patterns.</done>
</task>

## Success Criteria
- [ ] Super Admin and Staff authentication succeeds with valid credentials and fails on invalid ones.
- [ ] Session tokens are properly signed and tamper-evident.
- [ ] Middleware blocks unauthorized access to `/admin` routes and prevents staff IDOR access.
- [ ] Verification scripts pass with exit code 0.
