# aimhop-ERP — API Design

Base: `/api/v1`. JSON request/response. OpenAPI to be generated in Phase 1.

## Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/login` | email + password |
| POST | `/auth/logout` | clear session |
| POST | `/auth/refresh` | if using refresh tokens |
| GET | `/auth/me` | user, role, permissions[], staff summary |

## Staff self (`staff` role only)

No arbitrary `staffId` in URL.

| Method | Path |
|--------|------|
| GET | `/me/profile` |
| GET | `/me/attendance?from&to` |
| GET | `/me/attendance/summary?month=YYYY-MM` |
| GET | `/me/payments?from&to` |
| GET | `/me/payments/summary?month=YYYY-MM` |
| GET | `/me/receipts` |
| GET | `/me/receipts/:id` |
| GET | `/me/receipts/:id/pdf` |

**Authorization:** `:id` must belong to `user.staff_id`; else **404** (not 403, to avoid leaking IDs).

## Admin (permission-guarded)

Prefix optional: `/admin/...` or flat resources with middleware.

| Resource | Permissions | Endpoints |
|----------|-------------|-----------|
| Staff | `staff.*`, `staff.salary.*` | CRUD, search, filters, nested attendance/payments |
| Departments | `departments.*` | CRUD + staff counts |
| Categories | `categories.*` | CRUD |
| Attendance | `attendance.read`, `attendance.manage` | GET list, PUT bulk upsert |
| Payments | `payments.*` | POST create, GET list, GET pending |
| Receipts | `receipts.*` | POST from payment, GET PDF |
| Reports | `reports.*`, `reports.export` | GET + export query `format=pdf|xlsx` |
| Users | `users.manage` | CRUD, link `staff_id` |
| Roles | `roles.manage` | super_admin |
| Audit | `audit.read` | paginated filters |
| Settings | `settings.manage` | company + receipt template |

## Pagination & filters

Lists: `?page=1&limit=20&sort=-createdAt`  
Staff: `?q=&departmentId=&categoryId=&status=`  
Attendance: `?date=&departmentId=&categoryId=&staffId=`  
Reports: `?from=&to=&departmentId=&categoryId=&staffId=`

## Errors

```json
{ "code": "FORBIDDEN", "message": "..." }
{ "code": "VALIDATION_ERROR", "message": "...", "fields": { "email": "..." } }
```

## Audit hooks

POST/PATCH/DELETE on staff (salary fields), payments, receipts, departments, categories, users, roles → write `audit_logs`.
