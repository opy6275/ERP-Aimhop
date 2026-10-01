# aimhop-ERP — Database Design

PostgreSQL via Prisma. Implementations live in `prisma/schema.prisma`.

## ER overview

```
Company ──< Staff >── Department
              │
              ├── Category
              ├── User (0..1)
              ├── AttendanceRecord (per day)
              ├── Payment (per period / date)
              │     └── PaymentReceipt (0..1 per payment when issued)
              └── StaffDocument

Role ──< RolePermission >── Permission
User ── Role

User ──< AuditLog
```

## Tables (summary)

### `companies`
Branding and receipt header: name, legal name, address, logo, currency, timezone, receipt footer.

### `users`
`email`, `password_hash`, `role_id`, `staff_id` (nullable FK), `is_active`, `last_login_at`.

### `roles` / `permissions` / `role_permissions`
System roles: `super_admin`, `admin`, `staff`. Granular keys e.g. `staff.read`, `payments.create`, `reports.export`.

### `departments`
`code`, `name`, `description`, `head_staff_id`, `status`. Staff count = aggregate active staff.

### `staff_categories`
`name`, `description`, `status`.

### `staff`
- **Identity:** `staff_code` unique (e.g. `STAFF-00125`), personal fields, photo.
- **Employment:** `department_id`, `category_id`, designation, joining_date, employment_type, status (`active`|`inactive`).
- **Pay config:** `salary_amount`, `payment_type` (`monthly`|`daily`), bank fields (encrypt `account_number` at app layer).

### `attendance_records`
`staff_id`, `date`, `status` enum, `note`, `marked_by`. **Unique** `(staff_id, date)`.

### `payments`
`staff_id`, `period_month` (date, first of month), `payment_date`, `amount`, `payment_method`, `payment_kind` (salary|partial|advance|deduction|adjustment), `note`, `created_by`.

**Pending (computed):** for period P,  
`payable = staff.salary_amount` (or override rules for daily category)  
`paid = sum(payments where kind not deduction)` minus deductions/adjustments per business rules  
`pending = payable - net_paid`

### `payment_receipts`
Immutable snapshot: `receipt_number` unique (`PAY-2026-00128`), FK `payment_id`, denormalized employee/department/period/amount/method/authorized_by/company_name.

### `receipt_sequences`
`year`, `last_number` — transaction-safe increment.

### `staff_documents`
`staff_id`, `type`, `file_key`, `file_name`, `uploaded_by`.

### `audit_logs`
`actor_user_id`, `action`, `entity_type`, `entity_id`, `target_label`, `changes` JSON, `ip`, `created_at`.

## Indexes

- `staff(status, department_id)`, `staff(staff_code)`, search on `full_name`
- `attendance_records(date)`, `(staff_id, date)`
- `payments(staff_id, period_month)`
- `audit_logs(created_at DESC)`

## Staff isolation rule

Every staff-scoped query:

```sql
WHERE staff_id = :authenticatedStaffId
```

Admin bypass only when `ScopeContext.scope === ALL` and permission granted.
