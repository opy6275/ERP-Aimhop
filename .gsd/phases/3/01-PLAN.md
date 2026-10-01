---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Admin Daily Attendance Operations

## Objective
Verify and validate administrative attendance workflows: date-specific workforce attendance queries, department-wise filtering, bulk attendance status marking (present, absent, leave, half-day, holiday), unique constraint idempotency (`staffId_date`), and audit logging.

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- prisma/schema.prisma
- src/app/api/v1/admin/attendance/route.ts
- src/app/admin/attendance/page.tsx
- src/components/admin/attendance-mark.tsx

## Tasks

<task type="auto">
  <name>Validate Admin Daily Attendance Listing & Filtering</name>
  <files>src/app/api/v1/admin/attendance/route.ts</files>
  <action>
    - Write an integration test in `scripts/test-attendance-admin.js`.
    - Query attendance records for a specific date (UTC midnight formatted).
    - Validate query filters by date range (from/to) and department.
    - Confirm staff metadata (staffCode, fullName, department) is included in response.
  </action>
  <verify>node scripts/test-attendance-admin.js</verify>
  <done>Admin attendance queries by date, range, and department execute with correct staff relations.</done>
</task>

<task type="auto">
  <name>Validate Bulk Attendance Marking and Idempotent Upsert</name>
  <files>src/app/api/v1/admin/attendance/route.ts</files>
  <action>
    - Test marking multiple staff with varied statuses (present, absent, half_day, leave, holiday).
    - Test updating an already marked date to confirm it updates in-place rather than inserting duplicate records.
    - Confirm audit trail entry is written to `audit_logs` with action `attendance.mark`.
  </action>
  <verify>node scripts/test-attendance-admin.js</verify>
  <done>Bulk attendance marks properly, updates existing records cleanly, and records audit entries.</done>
</task>

## Success Criteria
- [ ] Daily attendance records are uniquely keyed by `(staffId, date)` with no duplicates.
- [ ] Admin can query attendance across dates, ranges, and departments.
- [ ] Marking operations generate audit log entries.
