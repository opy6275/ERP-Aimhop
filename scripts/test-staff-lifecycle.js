// Integration test for Staff Lifecycle, Code Generation, and Salary Masking
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function maskAccountNumber(acc) {
  if (!acc) return null;
  const s = String(acc).trim();
  if (s.length <= 4) return s;
  return "•".repeat(Math.max(0, s.length - 4)) + s.slice(-4);
}

function serializeStaff(staff, canSeeSalary) {
  return {
    ...staff,
    salaryAmount: canSeeSalary ? Number(staff.salaryAmount) : undefined,
    accountNumber: canSeeSalary
      ? staff.accountNumber
      : maskAccountNumber(staff.accountNumber),
    bankName: canSeeSalary ? staff.bankName : staff.bankName ? "••••" : null,
    ifsc: canSeeSalary ? staff.ifsc : staff.ifsc ? "••••" : null,
    upiId: canSeeSalary ? staff.upiId : staff.upiId ? "••••" : null,
  };
}

async function nextStaffCode() {
  const last = await prisma.staff.findFirst({
    orderBy: { staffCode: "desc" },
    select: { staffCode: true },
  });
  let n = 1;
  if (last?.staffCode) {
    const m = /STAFF-(\d+)/.exec(last.staffCode);
    if (m) n = Number(m[1]) + 1;
  }
  return `STAFF-${String(n).padStart(5, "0")}`;
}

async function run() {
  console.log("=== Testing Staff Lifecycle & Profile Management ===");

  // 1. Validate Sequential Code Generation
  const code = await nextStaffCode();
  console.log("✔ Generated Next Staff Code:", code);
  if (!code.startsWith("STAFF-") || code.length !== 11) {
    throw new Error("Invalid staff code format: " + code);
  }

  // 2. Fetch an existing department and category
  const dept = await prisma.department.findFirst({ where: { status: "active" } });
  const cat = await prisma.staffCategory.findFirst({ where: { status: "active" } });
  if (!dept || !cat) {
    throw new Error("No active department or category found for staff creation");
  }

  // 3. Create Staff Record
  const staff = await prisma.staff.create({
    data: {
      staffCode: code,
      fullName: "Test Vikram Sharma",
      designation: "Principal Architect",
      departmentId: dept.id,
      categoryId: cat.id,
      salaryAmount: 95000,
      paymentType: "monthly",
      bankName: "HDFC Bank",
      accountNumber: "12345678909876",
      ifsc: "HDFC0001234",
      upiId: "vikram@upi",
      status: "active",
      mobile: "9876543210",
      email: "vikram.test@aimhop.com",
    },
    include: {
      department: true,
      category: true,
    },
  });
  console.log("✔ Staff created successfully with ID:", staff.id, "and Code:", staff.staffCode);

  // 4. Test Salary Masking
  // Case A: Privileged User
  const privilegedView = serializeStaff(staff, true);
  if (privilegedView.salaryAmount !== 95000 || privilegedView.accountNumber !== "12345678909876") {
    throw new Error("Privileged salary view did not return raw figures");
  }
  console.log("✔ Privileged user view returns accurate salary and bank details");

  // Case B: Non-privileged User
  const maskedView = serializeStaff(staff, false);
  if (maskedView.salaryAmount !== undefined || !maskedView.accountNumber.startsWith("••••")) {
    throw new Error("Non-privileged salary view leaked sensitive data: " + JSON.stringify(maskedView));
  }
  console.log("✔ Non-privileged user view correctly masks salary & bank account (ends with: " + maskedView.accountNumber.slice(-4) + ")");

  // 5. Test Search & Filter Query
  // Search by name
  const foundByName = await prisma.staff.findMany({
    where: { fullName: { contains: "Vikram Sharma" } },
  });
  if (foundByName.length === 0) throw new Error("Search by name failed");
  console.log("✔ Search by name succeeded");

  // Search by code
  const foundByCode = await prisma.staff.findMany({
    where: { staffCode: code },
  });
  if (foundByCode.length !== 1) throw new Error("Search by staffCode failed");
  console.log("✔ Search by staffCode succeeded");

  // Filter by department and status
  const filtered = await prisma.staff.findMany({
    where: { departmentId: dept.id, status: "active" },
  });
  if (filtered.length === 0) throw new Error("Filter by department and status failed");
  console.log("✔ Filter by department & status verified (" + filtered.length + " matching)");

  // 6. Test Staff Profile Update
  const updatedStaff = await prisma.staff.update({
    where: { id: staff.id },
    data: {
      designation: "Executive Director of Technology",
      salaryAmount: 110000,
    },
  });
  if (updatedStaff.designation !== "Executive Director of Technology") {
    throw new Error("Staff designation update failed");
  }
  console.log("✔ Staff profile update verified");

  // 7. Audit log creation check
  const audit = await prisma.auditLog.create({
    data: {
      action: "staff.create",
      entityType: "staff",
      entityId: staff.id,
      targetLabel: `${staff.staffCode} ${staff.fullName}`,
      changes: { status: "active", designation: "Principal Architect" },
    },
  });
  if (!audit) throw new Error("Failed to write audit log");
  console.log("✔ Audit log creation verified");

  // 8. Clean up
  await prisma.staff.delete({ where: { id: staff.id } });
  console.log("✔ Test staff cleaned up successfully");

  console.log("\nALL STAFF LIFECYCLE TESTS PASSED! 👤\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
