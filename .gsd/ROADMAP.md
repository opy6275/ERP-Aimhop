# ROADMAP.md

> **Current Phase**: Not started  
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [x] Clean database initialization and seeded administrator credentials.
- [x] Role-based access control protecting `/admin/*` routes from unauthorized staff.
- [x] Functional staff management with automated code generation.
- [x] Daily attendance marking with employee self-view.
- [x] Salary disbursement recording with printable receipt generation.
- [x] Live dashboard KPIs and administrative audit logging.

## Phases

### Phase 1: Foundation & Auth Verification
**Status**: ✅ Complete  
**Objective**: Validate database connection, execute schema migration & seed, verify Super Admin and Staff authentication, test middleware protection and session cookie security.  
**Requirements**: REQ-01, REQ-02, REQ-03  

### Phase 2: Organization & Staff Management
**Status**: ✅ Complete  
**Objective**: Verify and refine Department and Staff Category management, Staff CRUD flows, auto-generation of `STAFF-#####` codes, and profile details editing.  
**Requirements**: REQ-04, REQ-05  

### Phase 3: Attendance Management
**Status**: ✅ Complete  
**Objective**: Enable daily attendance marking for all staff, date filtering, status toggling (present, absent, half-day, leave, holiday), and staff self-service attendance history.  
**Requirements**: REQ-06  

### Phase 4: Payments Ledger & Receipts
**Status**: ✅ Complete  
**Objective**: Build and verify payment recording (salary, advance, partial payment, deduction), automated receipt sequence generation (`PAY-YYYY-#####`), printable receipt modal, and staff self-service payment history.  
**Requirements**: REQ-07, REQ-08  

### Phase 5: Dashboards, Audit Logs & System Polish
**Status**: ✅ Complete  
**Objective**: Wire up live SQL KPI cards on Admin Dashboard, audit log tracking for all mutations, reports generation, and company settings configuration.  
**Requirements**: REQ-09, REQ-10  

