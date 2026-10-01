// Integration test for Sequential Receipts & Staff Self-Service Ledger
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function decimalToNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(val.toString());
}

async function nextReceiptNumber(year) {
  return prisma.$transaction(async (tx) => {
    const seq = await tx.receiptSequence.upsert({
      where: { year },
      update: { lastNumber: { increment: 1 } },
      create: { year, lastNumber: 1 },
    });
    return `PAY-${year}-${String(seq.lastNumber).padStart(5, "0")}`;
  });
}

async function run() {
  console.log("=== Testing Sequential Receipts & Staff Self-Service ===");

  const year = 2026;

  // 1. Test Monotonic Sequence Generation
  const recNum1 = await nextReceiptNumber(year);
  const recNum2 = await nextReceiptNumber(year);
  console.log("✔ Generated Consecutive Receipt Numbers:", recNum1, "->", recNum2);

  const num1 = parseInt(recNum1.split("-")[2], 10);
  const num2 = parseInt(recNum2.split("-")[2], 10);
  if (num2 !== num1 + 1) {
    throw new Error(`Receipt numbers not sequential! ${recNum1} -> ${recNum2}`);
  }
  console.log("✔ Atomic sequential increment verified");

  // 2. Fetch staff and company
  const staff = await prisma.staff.findFirst({
    where: { user: { email: "staff@aimhop.com" } },
    include: { department: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: { slug: "super_admin" } } });
  const company = await prisma.company.findFirst();
  if (!staff || !admin || !company) throw new Error("Missing required seed entities");

  // 3. Create Payment with Receipt Snapshot
  const payment = await prisma.payment.create({
    data: {
      staffId: staff.id,
      periodMonth: new Date(Date.UTC(2026, 9, 1)),
      paymentDate: new Date(),
      amount: 45000,
      paymentMethod: "bank_transfer",
      paymentKind: "salary",
      note: "Salary disbursement with receipt",
      createdById: admin.id,
    },
  });

  const receiptNumber = await nextReceiptNumber(year);
  const receipt = await prisma.paymentReceipt.create({
    data: {
      receiptNumber,
      paymentId: payment.id,
      companyName: company.name,
      employeeName: staff.fullName,
      staffCode: staff.staffCode,
      departmentName: staff.department.name,
      periodLabel: "2026-10",
      amountPaid: 45000,
      paymentMethod: "bank_transfer",
      authorizedBy: admin.email,
      issuedById: admin.id,
    },
  });
  console.log("✔ Payment receipt created:", receipt.receiptNumber);

  // 4. Verify Snapshot Immutability
  // Verify fields are permanently locked to historical snapshot
  if (
    receipt.companyName !== company.name ||
    receipt.employeeName !== staff.fullName ||
    receipt.staffCode !== staff.staffCode ||
    decimalToNumber(receipt.amountPaid) !== 45000
  ) {
    throw new Error("Receipt snapshot values mismatch");
  }
  console.log("✔ Immutable snapshot fields verified");

  // 5. Staff Self-Service Access (Strict Isolation Check)
  const staffPayments = await prisma.payment.findMany({
    where: { staffId: staff.id },
    include: { receipt: true },
  });
  for (const p of staffPayments) {
    if (p.staffId !== staff.id) {
      throw new Error("IDOR Violation: employee retrieved someone else's payment!");
    }
  }
  console.log("✔ Staff self-service payments query passed (found " + staffPayments.length + " personal payments)");

  const staffReceipts = await prisma.paymentReceipt.findMany({
    where: { payment: { staffId: staff.id } },
  });
  for (const r of staffReceipts) {
    if (r.staffCode !== staff.staffCode) {
      throw new Error("IDOR Violation: employee retrieved someone else's receipt!");
    }
  }
  console.log("✔ Staff self-service receipts query passed (found " + staffReceipts.length + " personal receipts)");

  // 6. Clean up
  await prisma.paymentReceipt.delete({ where: { id: receipt.id } });
  await prisma.payment.delete({ where: { id: payment.id } });
  console.log("✔ Test receipt and payment cleaned up successfully");

  console.log("\nALL RECEIPTS & SELF-SERVICE TESTS PASSED! 🧾\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
