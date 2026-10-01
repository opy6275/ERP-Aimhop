---
phase: 4
plan: 2
wave: 2
depends_on: [1]
---

# Plan 4.2: Sequential Receipts & Staff Self-Service Ledger

## Objective
Verify automated receipt sequence generation (`PAY-YYYY-#####`), immutable receipt snapshot integrity, and employee self-service access to own payments ledger and downloadable receipts without exposing organization-wide data.

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- src/lib/domain.ts
- src/app/api/v1/admin/payments/route.ts
- src/app/api/v1/me/payments/route.ts
- src/app/api/v1/me/receipts/route.ts
- src/components/admin/receipt-modal.tsx

## Tasks

<task type="auto">
  <name>Validate Sequential Receipt Numbering and Snapshot Immutability</name>
  <files>src/lib/domain.ts, src/app/api/v1/admin/payments/route.ts</files>
  <action>
    - Write an integration test in `scripts/test-receipts-sequence.js`.
    - Generate consecutive receipt numbers for year 2026 using `nextReceiptNumber(2026)`.
    - Verify atomic sequence incrementation (e.g. `PAY-2026-00001` -> `PAY-2026-00002`).
    - Create a payment receipt record and verify immutable snapshot fields (companyName, employeeName, staffCode, departmentName, amountPaid, periodLabel).
  </action>
  <verify>node scripts/test-receipts-sequence.js</verify>
  <done>Receipt sequence generates monotonic identifiers and stores immutable historical snapshots.</done>
</task>

<task type="auto">
  <name>Validate Staff Self-Service Payment & Receipt Isolation</name>
  <files>src/app/api/v1/me/payments/route.ts, src/app/api/v1/me/receipts/route.ts</files>
  <action>
    - Query employee self-service payments API for logged-in staff user (`staff@aimhop.com`).
    - Verify employee sees their personal base salary, balance calculations, and payment records.
    - Query employee self-service receipts API and assert returned receipts match the logged-in staff member exclusively.
    - Assert that zero other staff records are reachable.
  </action>
  <verify>node scripts/test-receipts-sequence.js</verify>
  <done>Staff payment ledger and receipts strictly restricted to authenticated employee.</done>
</task>

## Success Criteria
- [ ] Receipts sequence increments monotonically per calendar year without collision.
- [ ] Receipt stores immutable snapshot of company, department, and employee names.
- [ ] Employees can only view their own payments and receipts.
