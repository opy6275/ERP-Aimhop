# aimhop-ERP — Development Roadmap

Build incrementally. Do not skip RBAC tests between phases.

| Phase | Scope | Done when |
|-------|--------|-----------|
| **0** | Next.js + Prisma + PostgreSQL + `.env.example` + seed super admin | Login page renders; DB migrates |
| **1** | Auth (session/JWT), roles, permissions, `/me` vs `/admin` middleware | Integration tests: staff cannot read other staff via API |
| **2** | Departments, categories, staff CRUD, auto `STAFF-#####` | Admin list/search/filter works |
| **3** | Admin dashboard KPIs (live SQL) | Numbers match database |
| **4** | Attendance mark + history + staff my attendance | Unique `(staff_id, date)` |
| **5** | Payments, pending math, staff my payments | Partial/advance/deduction correct |
| **6** | Receipts (immutable snapshot, PDF, unique `PAY-YYYY-#####`) | Print/download |
| **7** | Reports + PDF/Excel export | Filters per product brief |
| **8** | Audit log UI + hooks on critical mutations | Actions visible |
| **9** | Users, role assignment, company/receipt settings | Super Admin flows |
| **10** | Hardening (field encryption, rate limits, E2E smoke) | Production checklist |

## UI build order

1. App shell (sidebar + role-based nav)
2. Admin dashboard
3. Staff module
4. Departments & categories
5. Attendance
6. Payments & receipts
7. Reports
8. Administration & settings

## Out of scope for v1

Leave approvals, payroll engine, shifts, biometrics, branches, notifications — architecture allows adding modules via new permissions + nav entries.
