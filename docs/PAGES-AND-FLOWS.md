# aimhop-ERP — Pages, Navigation & Flows

## Admin sidebar

```
Dashboard
Staff
  ├─ All Staff
  ├─ Add Staff
  └─ Staff Categories
Departments
  ├─ All Departments
  └─ Add Department
Attendance
  ├─ Mark Attendance
  ├─ Attendance History
  └─ Attendance Reports (→ Reports)
Payments
  ├─ Add Payment
  ├─ Payment History
  ├─ Pending Payments
  └─ Receipts
Reports
  ├─ Staff Reports
  ├─ Attendance Reports
  └─ Payment Reports
Administration
  ├─ Users
  ├─ Roles & Permissions
  └─ Activity Logs
Settings
```

Visibility = intersection of role and `permissions[]`. Super Admin sees all.

## Staff sidebar

```
My Dashboard
My Profile
My Attendance
My Payments
My Receipts
```

## Routes

| Path | Audience |
|------|----------|
| `/login` | Public |
| `/admin/dashboard` | Admin+ |
| `/admin/staff`, `/admin/staff/new`, `/admin/staff/[id]`, `/admin/staff/[id]/edit` | Admin+ |
| `/admin/departments`, `/admin/categories` | Admin+ |
| `/admin/attendance/mark`, `/admin/attendance/history` | Admin+ |
| `/admin/payments`, `/admin/payments/new`, `/admin/payments/pending` | Admin+ |
| `/admin/receipts`, `/admin/receipts/[id]` | Admin+ |
| `/admin/reports/staff`, `.../attendance`, `.../payments` | Admin+ |
| `/admin/users`, `/admin/roles`, `/admin/audit-logs`, `/admin/settings` | Restricted |
| `/app/dashboard`, `/app/profile`, `/app/attendance`, `/app/payments`, `/app/receipts` | Staff |

Post-login redirect: staff → `/app/dashboard`; admin/super_admin → `/admin/dashboard`.

## Admin dashboard KPIs

Total Staff · Active Staff · Present Today · Absent Today · On Leave · Departments · Categories · Current Month Payments · Pending Payments

Quick actions: Add Staff · Mark Attendance · Add Payment · (recent pending highlight)

## Staff dashboard

Profile card (photo, name, staff ID, department, designation)  
This month: present / absent / leave / half-day  
Payments: last paid, pending this month  
Links: receipts, full attendance

## Flow: payment + receipt

1. Admin → Add Payment → select staff + month → see payable / paid / pending  
2. Enter amount, method, kind → save  
3. Optional “Generate receipt” → snapshot + `PAY-YYYY-#####`  
4. Preview → Print / PDF  

Staff → My Receipts → download own PDF only.

## Flow: mark attendance

1. Default date = today  
2. Filter department / category  
3. Grid edit status  
4. Save bulk → audit entry  

Staff → read-only calendar + monthly summary.
