---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Database Schema & Seed Verification

## Objective
Establish a clean, synchronized local database schema using Prisma and SQLite, execute the comprehensive database seed script, and verify that all fundamental records (Company, Roles, Permissions, Super Admin user, and Demo Staff) exist with accurate relations.

## Context
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
- prisma/schema.prisma
- prisma/seed.ts
- .env.example

## Tasks

<task type="auto">
  <name>Synchronize Prisma Schema with Local SQLite</name>
  <files>prisma/schema.prisma, .env</files>
  <action>
    - Verify that `.env` contains `DATABASE_URL="file:./dev.db"`.
    - Run `npm run db:generate` to generate the latest Prisma client types.
    - Run `npm run db:push` to ensure SQLite database schema tables are created and match schema.prisma.
  </action>
  <verify>npx prisma db push --skip-generate</verify>
  <done>Prisma client generated without error and SQLite database tables are in sync with prisma/schema.prisma.</done>
</task>

<task type="auto">
  <name>Execute and Validate Database Seed</name>
  <files>prisma/seed.ts</files>
  <action>
    - Run `npm run db:seed` to populate default company settings, 25 system permissions, system roles (super_admin, admin, staff), departments, categories, and initial users.
    - Validate that `superadmin@aimhop.com` and `demo@aimhop.com` users exist in the database with hashed passwords.
  </action>
  <verify>node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); Promise.all([prisma.company.count(), prisma.user.count(), prisma.permission.count()]).then(([c, u, p]) => { console.log({ companies: c, users: u, permissions: p }); process.exit(c > 0 && u > 0 && p >= 20 ? 0 : 1); });"</verify>
  <done>Seed script completes successfully and database contains at least 1 company, 20+ permissions, and seeded admin/staff users.</done>
</task>

## Success Criteria
- [ ] Prisma client generated and SQLite schema pushed without errors.
- [ ] Database seeded with core permissions, roles, and administrative users.
- [ ] Verification script passes asserting presence of seeded entities.
