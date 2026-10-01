# aimhop-ERP — Architecture

## Product name

**aimhop-ERP** — internal company Staff Management ERP.

## Goals

- Single centralized workforce and payment records.
- **Super Admin / Admin / Staff** with server-enforced RBAC.
- Staff users: **only own** profile, attendance, payments, receipts.
- Production-minded: audit, validation, no IDOR via URL/API tampering.

## Logical architecture

```
Browser (Next.js UI)
    → API Routes / Server Actions (RBAC middleware)
        → Domain services (scope: ALL | SELF)
            → PostgreSQL (Prisma)
            → Private file storage (documents, PDFs)
        → Audit service → audit_logs
```

## Modules (code folders)

| Module | Responsibility |
|--------|----------------|
| `auth` | Login, session, password, `GET /auth/me` |
| `rbac` | Roles, permissions, guards |
| `staff` | Staff CRUD, profile, documents |
| `organization` | Departments, categories |
| `attendance` | Daily records, summaries |
| `payments` | Ledger, pending calculation |
| `receipts` | Snapshots, PDF, sequences |
| `reports` | Aggregations, export |
| `audit` | Append-only activity log |
| `settings` | Company profile, receipt header |

Future modules (leave, payroll, etc.) add tables + `permissions` keys + sidebar registry — no RBAC rewrite.

## Access model

| Role | Data scope |
|------|------------|
| `super_admin` | All data + settings + roles |
| `admin` | All operational data per assigned permissions |
| `staff` | Rows where `staff_id = user.staff_id` only |

Staff APIs use **`/api/v1/me/*`** — no `:staffId` in path for reads.

Admin APIs use **`/api/v1/admin/*`** or resource paths with permission checks.

## Security layers

1. Authentication (HTTP-only session or access + refresh tokens).
2. Route middleware: role + permission keys.
3. Service layer: `ScopeContext` injects `staffId` for staff role.
4. Query filters: always apply scope in repository, not only in controller.
5. Field-level: bank/account masked unless `staff.salary.read`.
6. Documents: signed URLs; admin-only upload.
7. Audit on sensitive mutations.

## Assumptions (MVP)

- Single company per deployment (`companies` single row).
- Currency INR (₹), timezone `Asia/Kolkata`, dates `DD/MM/YYYY` in UI.
- Monthly payment period (`YYYY-MM`); multiple partial payments allowed.
- Attendance statuses: Present, Absent, Leave, Half Day, Holiday.
- Optional login per staff (`users.staff_id` nullable until linked).
- Deactivate preferred over delete; hard delete super_admin only when safe.

See [DATABASE.md](./DATABASE.md), [API.md](./API.md), [PAGES-AND-FLOWS.md](./PAGES-AND-FLOWS.md), [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).
