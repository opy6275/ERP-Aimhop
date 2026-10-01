# aimhop-ERP

Company Staff Management ERP — local development workspace.

Centralized staff, departments, categories, attendance, payments, receipts, and reports with strict role-based access (Admin vs Staff).

## Status

- **Phase:** 0 — Next.js + Prisma + login (local)
- **Git:** Local only — remote push baad me

## Local setup (Phase 0)

```powershell
cd C:\Users\Administrator\Projects\aimhop-ERP
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Browser: [http://localhost:3000/login](http://localhost:3000/login)

**Demo login:** `demo@aimhop.com` / `Demo@123`  
**Super Admin:** `superadmin@aimhop.com` / `Admin@123`

## Open in Cursor

**File → Open Folder →** `C:\Users\Administrator\Projects\aimhop-ERP`

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System overview, modules, security |
| [docs/DATABASE.md](./docs/DATABASE.md) | Entity relationships & field notes |
| [docs/API.md](./docs/API.md) | REST API surface & authorization rules |
| [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) | UI tokens, components, layouts |
| [docs/PAGES-AND-FLOWS.md](./docs/PAGES-AND-FLOWS.md) | Routes, navigation, user flows |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Incremental build phases |

## Planned stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Server-side RBAC on every API route

## Principles

1. **One company, one staff system** — single-tenant deployment.
2. **Staff see only self** — enforced via `/api/v1/me/*` and server scope checks, not UI hiding alone.
3. **Auditable** — sensitive admin actions logged.

Implementation starts after design sign-off; follow [docs/ROADMAP.md](./docs/ROADMAP.md).
