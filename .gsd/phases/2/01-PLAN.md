---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Department and Staff Category Management

## Objective
Verify and validate the full organizational unit lifecycle: creation, retrieval, updates, status management, and active workforce count aggregation for both Departments and Staff Categories.

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- src/app/api/v1/admin/departments/route.ts
- src/app/api/v1/admin/departments/[id]/route.ts
- src/app/api/v1/admin/categories/route.ts
- src/app/api/v1/admin/categories/[id]/route.ts
- src/components/admin/department-form.tsx
- src/components/admin/category-form.tsx

## Tasks

<task type="auto">
  <name>Validate Department Management APIs and Workforce Counts</name>
  <files>src/app/api/v1/admin/departments/route.ts, src/app/api/v1/admin/departments/[id]/route.ts</files>
  <action>
    - Write an integration test in `scripts/test-departments.js`.
    - Test creating a new department with unique code and name.
    - Test fetching department listing and assert `activeStaffCount` is calculated properly.
    - Test updating department name, description, and status.
    - Test validation rules (reject empty name, handle duplicate codes gracefully).
  </action>
  <verify>node scripts/test-departments.js</verify>
  <done>Department creation, update, listing, and staff count aggregation verified with automated test script.</done>
</task>

<task type="auto">
  <name>Validate Staff Category Management APIs</name>
  <files>src/app/api/v1/admin/categories/route.ts, src/app/api/v1/admin/categories/[id]/route.ts</files>
  <action>
    - Write an integration test in `scripts/test-categories.js`.
    - Test creating staff categories (e.g., "Full-Time", "Contract", "Intern").
    - Test fetching category listing with active staff count.
    - Test updating category status between active and inactive.
    - Test rejection of duplicate category names.
  </action>
  <verify>node scripts/test-categories.js</verify>
  <done>Category CRUD and unique constraint enforcement verified with automated test script.</done>
</task>

## Success Criteria
- [ ] Department APIs create, update, and list departments with correct active headcount.
- [ ] Category APIs manage categories and enforce unique name constraints.
- [ ] Audit logs are recorded for all department and category mutations.
