---
phase: 3
plan: 2
wave: 2
depends_on: [1]
---

# Plan 3.2: Staff Self-Service Attendance & Calendar Aggregation

## Objective
Verify the employee self-service attendance portal: personal check-in submission (`POST /api/v1/me/attendance`), monthly calendar history retrieval (`GET /api/v1/me/attendance?month=YYYY-MM`), automated summary breakdown calculation, and guaranteed isolation from other employees' data.

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- src/app/api/v1/me/attendance/route.ts
- src/app/app/attendance/page.tsx
- src/components/staff/staff-checkin-card.tsx

## Tasks

<task type="auto">
  <name>Validate Staff Self-Checkin and Upsert</name>
  <files>src/app/api/v1/me/attendance/route.ts</files>
  <action>
    - Write an integration test in `scripts/test-attendance-self.js`.
    - Authenticate as staff member (`staff@aimhop.com`).
    - Perform self-checkin for current date with status "present" and a note.
    - Submit second check-in for the same day with updated note and verify it updates without error.
    - Verify audit log is recorded with action `attendance.checkin`.
  </action>
  <verify>node scripts/test-attendance-self.js</verify>
  <done>Self-checkin functions seamlessly and updates same-day status idempotently.</done>
</task>

<task type="auto">
  <name>Validate Monthly Attendance History & Summary Metrics</name>
  <files>src/app/api/v1/me/attendance/route.ts</files>
  <action>
    - Query attendance for a specific month (e.g. `2026-10`).
    - Validate that returned records strictly belong to the authenticated staff member.
    - Validate summary statistics match count of individual days (present, absent, leave, half_day, holiday).
  </action>
  <verify>node scripts/test-attendance-self.js</verify>
  <done>Staff attendance query returns accurate personal records and computed status counts.</done>
</task>

## Success Criteria
- [ ] Employees can record their daily check-in without access to other staff records.
- [ ] Check-in updates same-day status without duplicating date entries.
- [ ] Monthly history correctly calculates total present, absent, half-day, and leave days.
