const http = require("http");

// We will test direct function evaluation using our Prisma & Auth modules
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function testAudits() {
  console.log("\n--- STARTING DEEP AUDIT CHECKS ---");

  // Check 1: User authentication integrity
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@aimhop.com" },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!demoUser) throw new Error("Demo admin user not found!");
  const demoPwOk = await bcrypt.compare("Demo@123", demoUser.passwordHash);
  if (!demoPwOk) throw new Error("Demo admin password mismatch!");
  console.log("✔ Demo admin user exists and password verifies successfully");

  // Check 2: Super Admin
  const superAdmin = await prisma.user.findUnique({
    where: { email: "superadmin@aimhop.com" },
    include: { role: true },
  });
  if (!superAdmin) throw new Error("Super admin user not found!");
  const superPwOk = await bcrypt.compare("Admin@123", superAdmin.passwordHash);
  if (!superPwOk) throw new Error("Super admin password mismatch!");
  console.log("✔ Super Admin user exists and password verifies successfully");

  // Check 3: Staff User
  const staffUser = await prisma.user.findUnique({
    where: { email: "staff@aimhop.com" },
    include: { role: true, staff: { include: { department: true } } },
  });
  if (!staffUser) throw new Error("Staff user not found!");
  const staffPwOk = await bcrypt.compare("Staff@123", staffUser.passwordHash);
  if (!staffPwOk) throw new Error("Staff password mismatch!");
  if (!staffUser.staff) throw new Error("Staff user is not linked to a staff record!");
  console.log(`✔ Staff user verified: ${staffUser.staff.fullName} (${staffUser.staff.department.name})`);

  // Check 4: Company details
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company record found!");
  console.log(`✔ Company profile: ${company.name} (${company.currency}, ${company.timezone})`);

  // Check 5: Departments & Categories
  const depts = await prisma.department.findMany();
  const cats = await prisma.staffCategory.findMany();
  console.log(`✔ Departments count: ${depts.length}, Categories count: ${cats.length}`);

  // Check 6: Staff count and active staff
  const staffCount = await prisma.staff.count();
  const activeStaff = await prisma.staff.count({ where: { status: "active" } });
  console.log(`✔ Total staff: ${staffCount}, Active staff: ${activeStaff}`);

  // Check 7: Today's attendance
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const presentToday = await prisma.attendanceRecord.count({ where: { date: todayUtc, status: "present" } });
  const absentToday = await prisma.attendanceRecord.count({ where: { date: todayUtc, status: "absent" } });
  const leaveToday = await prisma.attendanceRecord.count({ where: { date: todayUtc, status: "leave" } });
  const halfDayToday = await prisma.attendanceRecord.count({ where: { date: todayUtc, status: "half_day" } });
  console.log(`✔ Today's attendance stats -> Present: ${presentToday}, Absent: ${absentToday}, Leave: ${leaveToday}, Half-day: ${halfDayToday}`);

  // Check 8: Payments & Receipts
  const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthPayments = await prisma.payment.findMany({ where: { periodMonth }, include: { receipt: true } });
  const totalPaid = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  console.log(`✔ Current month payments count: ${monthPayments.length}, Total paid: ₹${totalPaid}`);

  const receipts = await prisma.paymentReceipt.findMany();
  console.log(`✔ Total receipts generated: ${receipts.length}`);

  // Check 9: Audit Logs
  const auditLogs = await prisma.auditLog.findMany();
  console.log(`✔ Total activity/audit logs: ${auditLogs.length}`);

  console.log("\nALL DATABASE AND MOCK INTEGRITY CHECKS PASSED SUCCESSFULLY!\n");
}

testAudits()
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
