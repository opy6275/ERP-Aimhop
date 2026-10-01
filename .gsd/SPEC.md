# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
aimhop-ERP is a centralized, robust Company Staff Management and Operations ERP tailored for internal workforce administration. It provides a secure, role-based platform where administrators manage employee profiles, departments, categories, attendance, salary disbursements, and immutable receipts, while staff members have a private self-service portal to view their own attendance and payment records with zero data leakage.

## Goals
1. Establish a validated database schema (Prisma + SQLite/Postgres) and complete seed data with default company settings, roles, and permissions.
2. Ensure bulletproof authentication and RBAC where Super Admin and Admin have granular administrative controls, and Staff access is strictly scoped to self (`/api/v1/me/*`).
3. Complete and verify core workforce operations: Staff management with auto-generated staff codes (`STAFF-#####`), department and category assignments.
4. Implement reliable daily attendance marking with audit tracking and employee self-view.
5. Provide payments ledger supporting partial payments, advances, and deductions with auto-generated receipt snapshots (`PAY-YYYY-#####`) and downloadable documents.
6. Deliver live administrative KPI dashboards, audit log tracking, and report exports.

## Non-Goals (Out of Scope)
- Complex multi-level leave approval hierarchies (future version).
- Automated biometric hardware integrations or third-party payroll tax engine calculations (PF/ESI tax filing).
- Multi-company / multi-tenant SaaS architecture (aimhop-ERP is single-tenant for a single company).
- Push notifications or SMS gateways in initial release.

## Users
- **Super Admin**: Full system control including user management, role assignments, system settings, and audit logs.
- **Admin**: Day-to-day operational managers who manage staff records, record attendance, issue payments, and view reports based on assigned permissions.
- **Staff (Employees)**: Individual employees who log into the mobile-responsive self-service portal (`/app/*`) to view their own profile, attendance records, payment history, and salary receipts.

## Constraints
- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM.
- **Database**: SQLite in local development (`prisma/dev.db`), PostgreSQL in production.
- **Security**: Server-enforced authorization and data scoping on all routes; no client-side-only security.
- **Localization**: Currency INR (₹), Timezone `Asia/Kolkata`, dates formatted as `DD/MM/YYYY`.

## Success Criteria
- [ ] Database migrations execute cleanly and seed script populates default super admin, permissions, and demo data.
- [ ] Authentication successfully logs in Super Admin (`superadmin@aimhop.com`) and Demo Staff (`demo@aimhop.com`) to their respective dashboards (`/admin/dashboard` vs `/app/dashboard`).
- [ ] Staff cannot access `/admin/*` routes or query other employees' records via API tampering.
- [ ] Admin can create staff, record daily attendance, disburse payments, and generate printable receipts.
- [ ] Audit logs record all critical administrative mutations.
