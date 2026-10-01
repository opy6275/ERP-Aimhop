---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Payments Ledger & Balance Mathematics

## Objective
Verify the financial disbursements engine: recording transactions across all payment kinds (salary, partial, advance, deduction, adjustment), payment methods (bank_transfer, upi, cash), and validating the period balance mathematical calculations (net paid and pending balances).

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- src/lib/domain.ts
- src/app/api/v1/admin/payments/route.ts
- src/components/admin/payment-form.tsx

## Tasks

<task type="auto">
  <name>Validate Payments Disbursement and Transaction Kinds</name>
  <files>src/app/api/v1/admin/payments/route.ts, src/lib/domain.ts</files>
  <action>
    - Write an integration test in `scripts/test-payments-ledger.js`.
    - Record multiple payments for an employee for a specific period (e.g. 2026-10):
      - Initial partial payment (₹20,000 via UPI)
      - Advance payment (₹10,000 via cash)
      - Deduction (₹2,000 penalty/late)
      - Final salary balance payment
    - Verify audit log is generated with action `payment.create`.
  </action>
  <verify>node scripts/test-payments-ledger.js</verify>
  <done>Payments across multiple transaction kinds record accurately in the database.</done>
</task>

<task type="auto">
  <name>Validate Period Balance Computation Mathematics</name>
  <files>src/lib/domain.ts</files>
  <action>
    - Validate `computePeriodBalance` with varied scenarios:
      - Agreed salary = ₹50,000
      - Paid = ₹25,000, Deduction = ₹3,000, Adjustment = ₹1,000
      - Net Paid must equal ₹23,000 (25000 - 3000 + 1000)
      - Pending must equal ₹27,000 (50000 - 23000)
      - Verify overpayment clamp: pending never drops below 0.
  </action>
  <verify>node scripts/test-payments-ledger.js</verify>
  <done>Balance calculation math accurately calculates net paid, pending, and deductions.</done>
</task>

## Success Criteria
- [ ] Payments ledger handles partial, advance, and deduction transaction types.
- [ ] Period math accurately computes pending balance without negative values.
- [ ] Audit logs track every payment disbursement.
