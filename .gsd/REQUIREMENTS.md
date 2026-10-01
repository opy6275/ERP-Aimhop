# REQUIREMENTS.md

## Requirements Traceability

| ID | Requirement | Source | Status |
|----|-------------|--------|--------|
| REQ-01 | Database schema migrations and seed execution with initial company, roles, permissions, and admin accounts | SPEC Goal 1 | Complete (Plan 1.1) |
| REQ-02 | Authentication and cookie session management with role-based routing (/admin vs /app) and middleware protection | SPEC Goal 2 | Complete (Plan 1.2) |
| REQ-03 | Strict data scoping where staff API endpoints (/api/v1/me/*) restrict records exclusively to the logged-in staff | SPEC Goal 2 | Complete (Plan 1.2) |
| REQ-04 | Department and Staff Category management with CRUD and active/inactive status | SPEC Goal 3 | Complete (Plan 2.1) |
| REQ-05 | Staff profile lifecycle with automatic STAFF-##### code generation, details, bank info, and department/category linkage | SPEC Goal 3 | Complete (Plan 2.2) |
| REQ-06 | Daily attendance marking interface with status (present, absent, half_day, leave, holiday) and staff personal history view | SPEC Goal 4 | Pending |
| REQ-07 | Payments ledger supporting salary, advances, partial payments, and deductions with period calculations | SPEC Goal 5 | Pending |
| REQ-08 | Payment receipt generation with sequence numbering (PAY-YYYY-#####), immutable snapshot, and print/download view | SPEC Goal 5 | Pending |
| REQ-09 | Admin dashboard KPI cards showing live workforce, attendance rate, and pending payment calculations | SPEC Goal 6 | Pending |
| REQ-10 | Append-only audit logging capturing actor, action, entity, timestamp, and changes on administrative mutations | SPEC Goal 6 | Pending |
