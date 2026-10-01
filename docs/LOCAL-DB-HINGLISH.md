# Database local kaise chalayein (Phase 0)

## Current default — SQLite (Docker ke bina)

`.env` me:

```
DATABASE_URL="file:./dev.db"
```

```powershell
cd C:\Users\Administrator\Projects\aimhop-ERP
npx prisma db push
npm run db:seed
npm run dev
```

DB file: `prisma/dev.db`

**Demo login:** `demo@aimhop.com` / `Demo@123`  
**Super Admin:** `superadmin@aimhop.com` / `Admin@123`

## Later — PostgreSQL (production)

1. `prisma/schema.prisma` me `provider = "postgresql"`
2. `.env` me Postgres URL
3. `npx prisma migrate dev`
4. `npm run db:seed`

Ya Docker:

```powershell
docker compose up -d
```

