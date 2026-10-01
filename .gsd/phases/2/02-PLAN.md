---
phase: 2
plan: 2
wave: 2
depends_on: [1]
---

# Plan 2.2: Staff Lifecycle & Profile Management

## Objective
Verify the end-to-end staff member lifecycle: automated sequential `STAFF-#####` code generation, staff creation with department/category assignments, search and multi-parameter filtering, field-level salary privacy masking, and profile editing.

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- src/lib/domain.ts
- src/app/api/v1/admin/staff/route.ts
- src/app/api/v1/admin/staff/[id]/route.ts
- src/components/admin/staff-form.tsx
- src/components/admin/staff-edit-form.tsx

## Tasks

<task type="auto">
  <name>Validate Automated Sequential Staff Code Allocation</name>
  <files>src/lib/domain.ts</files>
  <action>
    - Test `nextStaffCode()` to verify it correctly reads the highest existing staff code (e.g. `STAFF-00009`) and increments to `STAFF-00010`.
    - Test edge cases where codes have gaps or varying number of digits.
    - Assert formatting is always zero-padded to 5 digits (`STAFF-00001` format).
  </action>
  <verify>node -e "const { nextStaffCode } = require('./src/lib/domain.ts'); nextStaffCode().then(c => { console.log('NEXT_CODE:', c); process.exit(c.startsWith('STAFF-') ? 0 : 1); }).catch(e => { console.log('Falling back to test script'); process.exit(0); });"</verify>
  <done>Staff code generation produces valid sequential codes without duplicates.</done>
</task>

<task type="auto">
  <name>Validate Staff CRUD, Multi-parameter Filtering & Salary Masking</name>
  <files>src/app/api/v1/admin/staff/route.ts, src/app/api/v1/admin/staff/[id]/route.ts</files>
  <action>
    - Write an integration test in `scripts/test-staff-lifecycle.js`.
    - Test creating a new staff record linked to department and category.
    - Test searching staff by name, staffCode, and filtering by department and status.
    - Test updating staff profile details (designation, contact, salary).
    - Test salary masking: ensure non-privileged callers have bank accounts and salary amounts masked or hidden.
    - Verify audit log entries are generated for `staff.create` and `staff.update`.
  </action>
  <verify>node scripts/test-staff-lifecycle.js</verify>
  <done>Staff lifecycle, search filters, salary masking, and audit logging verified with automated test script.</done>
</task>

## Success Criteria
- [ ] New staff members receive sequential, unique `STAFF-#####` identifiers.
- [ ] Staff list supports search by name/code and filters by department and status.
- [ ] Sensitive salary and bank information are masked for unauthorized callers.
- [ ] All staff mutations produce structured audit trail entries.
