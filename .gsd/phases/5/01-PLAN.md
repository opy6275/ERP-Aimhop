---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Admin Dashboard Live KPIs & Analytics Polish

## Objective
Wire up and verify live SQL KPI calculations on the Admin Dashboard and Analytics pages. This ensures administrative users have immediate, accurate visibility into total active workforce, daily attendance presence rates, monthly disbursement totals, and pending salary balances.

## Context
- `.gsd/SPEC.md`
- `.gsd/REQUIREMENTS.md` (REQ-09)
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/reports/page.tsx`
- `src/lib/domain.ts`

## Tasks

<task type="auto">
  <name>Verify and optimize Admin Dashboard Live KPIs</name>
  <files>src/app/admin/dashboard/page.tsx, src/lib/domain.ts</files>
  <action>
    - Verify that live queries aggregate active workforce headcount, present/absent/half-day/leave attendance metrics, and monthly disbursement totals.
    - Confirm pending balance math accounts for staff base salary minus payments recorded for the period.
    - Ensure presence rate percentage accurately factors in half-day counts (0.5 weight) and avoids division by zero.
  </action>
  <verify>npm run build</verify>
  <done>Admin Dashboard loads with live SQL aggregate KPIs and presence rate progress visual without errors.</done>
</task>

<task type="auto">
  <name>Audit Trail verification and administrative mutation tracking</name>
  <files>src/app/admin/audit-logs/page.tsx, src/lib/audit.ts</files>
  <action>
    - Ensure `writeAudit` is called on all critical administrative mutations: auth logins, staff additions/edits, payment ledger entries, and settings updates.
    - Confirm the audit log viewer displays actor email, action badge, entity label, and formatted timestamp in IST.
  </action>
  <verify>node scripts/test-phase-5.js</verify>
  <done>Audit log records are append-only and visible on /admin/audit-logs.</done>
</task>

## Success Criteria
- [ ] Admin Dashboard displays live workforce, attendance rate %, and pending payout balance.
- [ ] Administrative mutations (auth, payments, staff) write to the append-only audit trail.
- [ ] All verification tests pass with exit code 0.
