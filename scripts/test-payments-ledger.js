// Integration test for Payments Ledger & Balance Mathematics
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function decimalToNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(val.toString());
}

function parsePeriodMonth(str) {
  if (!/^\d{4}-\d{2}$/.test(str)) return null;
  const [y, m] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

function computePeriodBalance(salaryAmount, payments) {
  let paid = 0;
  let deductions = 0;
  let adjustments = 0;

  for (const p of payments) {
    const amt = decimalToNumber(p.amount);
    switch (p.paymentKind) {
      case "deduction":
        deductions += amt;
        break;
      case "adjustment":
        adjustments += amt;
        break;
      default:
        paid += amt;
    }
  }

  const netPaid = paid - deductions + adjustments;
  const pending = Math.max(0, salaryAmount - netPaid);

  return { payable: salaryAmount, paid, deductions, adjustments, netPaid, pending };
}

async function run() {
  console.log("=== Testing Payments Ledger & Balance Math ===");

  // 1. Validate Balance Math Function
  const testSalary = 50000;
  const testTxns = [
    { amount: 20000, paymentKind: "partial" },
    { amount: 10000, paymentKind: "advance" },
    { amount: 2000, paymentKind: "deduction" },
    { amount: 1000, paymentKind: "adjustment" },
  ];

  const balance = computePeriodBalance(testSalary, testTxns);
  console.log("Calculated Balance:", balance);

  if (balance.paid !== 30000) throw new Error("Expected paid 30000, got " + balance.paid);
  if (balance.deductions !== 2000) throw new Error("Expected deductions 2000, got " + balance.deductions);
  if (balance.adjustments !== 1000) throw new Error("Expected adjustments 1000, got " + balance.adjustments);
  if (balance.netPaid !== 29000) throw new Error("Expected netPaid 29000, got " + balance.netPaid);
  if (balance.pending !== 21000) throw new Error("Expected pending 21000, got " + balance.pending);
  console.log("✔ Period balance math verified accurately");

  // 2. Validate Overpayment Clamp to 0
  const overpaidBalance = computePeriodBalance(testSalary, [
    { amount: 65000, paymentKind: "salary" },
  ]);
  if (overpaidBalance.pending !== 0) {
    throw new Error("Pending balance should be clamped to 0 on overpayment, got " + overpaidBalance.pending);
  }
  console.log("✔ Overpayment balance clamp to 0 verified");

  // 3. Locate Staff Member and Admin User
  const staff = await prisma.staff.findFirst({ where: { status: "active" } });
  const admin = await prisma.user.findFirst({ where: { role: { slug: "super_admin" } } });
  if (!staff || !admin) throw new Error("Required staff or admin user not found");

  const periodMonth = parsePeriodMonth("2026-10");

  // 4. Record Test Payment in Database
  const payment = await prisma.payment.create({
    data: {
      staffId: staff.id,
      periodMonth,
      paymentDate: new Date(),
      amount: 15000,
      paymentMethod: "upi",
      paymentKind: "partial",
      note: "Mid-month advance partial disbursement",
      createdById: admin.id,
    },
  });
  if (!payment || decimalToNumber(payment.amount) !== 15000) {
    throw new Error("Failed to record payment in database");
  }
  console.log("✔ Payment record created successfully:", payment.id);

  // 5. Query payment with staff relation
  const queried = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: { staff: true, createdBy: true },
  });
  if (!queried || queried.staff.id !== staff.id) {
    throw new Error("Payment relation query mismatch");
  }
  console.log("✔ Payment query with staff relation verified");

  // 6. Test Audit Log
  const audit = await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "payment.create",
      entityType: "payment",
      entityId: payment.id,
      targetLabel: `${staff.staffCode} INR 15000`,
    },
  });
  if (!audit) throw new Error("Failed to create payment audit log");
  console.log("✔ Payment audit log verified");

  // 7. Clean up test payment
  await prisma.payment.delete({ where: { id: payment.id } });
  console.log("✔ Test payment cleaned up successfully");

  console.log("\nALL PAYMENTS LEDGER TESTS PASSED! 💰\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
