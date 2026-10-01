const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  const depts = await prisma.department.findMany();
  const cats = await prisma.staffCategory.findMany();
  const staff = await prisma.staff.findMany();
  const attendance = await prisma.attendanceRecord.findMany();
  const payments = await prisma.payment.findMany();
  const receipts = await prisma.paymentReceipt.findMany();

  console.log("=== DB CHECK RESULT ===");
  console.log("Users:", users.length, users.map(u => ({ email: u.email, role: u.role.slug })));
  console.log("Departments:", depts.length, depts.map(d => d.name));
  console.log("Categories:", cats.length, cats.map(c => c.name));
  console.log("Staff:", staff.length);
  console.log("Attendance:", attendance.length);
  console.log("Payments:", payments.length);
  console.log("Receipts:", receipts.length);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
