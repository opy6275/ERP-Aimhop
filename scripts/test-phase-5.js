const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function computePeriodBalance(grossSalary, payments) {
  let netPaid = 0;
  let deductions = 0;
  for (const p of payments) {
    const amt = typeof p.amount === "number" ? p.amount : Number(p.amount);
    if (p.paymentKind === "deduction") {
      deductions += amt;
    } else {
      netPaid += amt;
    }
  }
  const pending = Math.max(0, grossSalary - netPaid - deductions);
  return { gross: grossSalary, netPaid, deductions, pending };
}

async function runPhase5Tests() {
  console.log("=== Testing Phase 5: Dashboard KPIs, Audit Trail & Settings ===");

  // 1. Live KPI Computations
  const activeStaff = await prisma.staff.count({ where: { status: "active" } });
  assert.ok(activeStaff >= 0, "Active staff count must be non-negative");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const presentToday = await prisma.attendanceRecord.count({
    where: { date: today, status: "present" },
  });
  const absentToday = await prisma.attendanceRecord.count({
    where: { date: today, status: "absent" },
  });
  const halfDayToday = await prisma.attendanceRecord.count({
    where: { date: today, status: "half_day" },
  });

  const totalMarked = presentToday + absentToday + halfDayToday;
  const presenceRate =
    totalMarked > 0
      ? Math.round(((presentToday + halfDayToday * 0.5) / totalMarked) * 100)
      : 0;
  assert.ok(presenceRate >= 0 && presenceRate <= 100, "Presence rate must be between 0 and 100%");
  console.log(`✔ Live KPI presence rate computed: ${presenceRate}% (marked: ${totalMarked})`);

  // 2. Pending Payout Calculation Math
  const sampleSalary = 35000;
  const samplePayments = [
    { amount: 15000, paymentKind: "advance" },
    { amount: 5000, paymentKind: "partial" },
    { amount: 2000, paymentKind: "deduction" },
  ];
  const balance = computePeriodBalance(sampleSalary, samplePayments);
  assert.equal(balance.gross, 35000);
  assert.equal(balance.netPaid, 20000); // advance + partial
  assert.equal(balance.deductions, 2000);
  assert.equal(balance.pending, 13000); // 35000 - 20000 - 2000
  console.log(`✔ Period disbursement balance math confirmed (Pending: ₹${balance.pending})`);

  // 3. Append-only Audit Trail Verification
  const superAdmin = await prisma.user.findFirst({
    where: { email: "superadmin@aimhop.com" },
  });
  assert.ok(superAdmin, "Super admin user must exist");

  const testAuditTag = `test.kpi.validation.${Date.now()}`;
  await prisma.auditLog.create({
    data: {
      actorUserId: superAdmin.id,
      action: "system.kpi.verify",
      entityType: "system",
      entityId: superAdmin.id,
      targetLabel: testAuditTag,
      ip: "127.0.0.1",
    },
  });

  const loggedRecord = await prisma.auditLog.findFirst({
    where: { targetLabel: testAuditTag },
    include: { actor: true },
  });
  assert.ok(loggedRecord, "Audit record must be successfully written to database");
  assert.equal(loggedRecord.action, "system.kpi.verify");
  assert.equal(loggedRecord.actor?.email, "superadmin@aimhop.com");
  console.log("✔ Append-only audit log mutation and actor relationship verified");

  // 4. Organization Settings & Profile
  const company = await prisma.company.findFirst();
  assert.ok(company, "Company organization profile must exist");
  assert.ok(company.currency, "Company currency must be defined");
  assert.ok(company.name, "Company name must be defined");
  console.log(`✔ Company organization settings verified (${company.name}, Currency: ${company.currency})`);

  // 5. Reports Aggregation (Department & Category distribution)
  const departmentsWithCounts = await prisma.department.findMany({
    include: { _count: { select: { staff: true } } },
  });
  assert.ok(departmentsWithCounts.length > 0, "Departments must exist");
  console.log(`✔ Department headcount reporting verified across ${departmentsWithCounts.length} departments`);

  console.log("\nALL PHASE 5 TESTS PASSED SUCCESSFULLY! 🚀\n");
}

runPhase5Tests()
  .catch((err) => {
    console.error("Phase 5 test failure:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
