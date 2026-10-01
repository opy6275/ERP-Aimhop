import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: "staff.read", description: "View staff" },
  { key: "staff.create", description: "Create staff" },
  { key: "staff.update", description: "Update staff" },
  { key: "staff.deactivate", description: "Deactivate staff" },
  { key: "staff.delete", description: "Delete staff" },
  { key: "staff.salary.read", description: "View salary & bank" },
  { key: "staff.salary.update", description: "Update salary & bank" },
  { key: "departments.read", description: "View departments" },
  { key: "departments.manage", description: "Manage departments" },
  { key: "categories.read", description: "View categories" },
  { key: "categories.manage", description: "Manage categories" },
  { key: "attendance.read", description: "View attendance" },
  { key: "attendance.manage", description: "Mark attendance" },
  { key: "payments.read", description: "View payments" },
  { key: "payments.create", description: "Record payments" },
  { key: "receipts.read", description: "View receipts" },
  { key: "receipts.generate", description: "Generate receipts" },
  { key: "reports.staff", description: "Staff reports" },
  { key: "reports.attendance", description: "Attendance reports" },
  { key: "reports.payments", description: "Payment reports" },
  { key: "reports.export", description: "Export reports" },
  { key: "users.manage", description: "Manage users" },
  { key: "roles.manage", description: "Manage roles" },
  { key: "audit.read", description: "View audit logs" },
  { key: "settings.manage", description: "System settings" },
] as const;

function getUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function main() {
  console.log("Seeding aimhop-ERP database...");

  // 1. Company
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "aimhop Company",
      legalName: "aimhop Company Pvt Ltd",
      currency: "INR",
      timezone: "Asia/Kolkata",
      receiptFooter: "This is a computer-generated salary receipt from aimhop-ERP.",
    },
  });

  // 2. Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description },
      create: p,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  // 3. Roles
  const superAdminRole = await prisma.role.upsert({
    where: { slug: "super_admin" },
    update: { name: "Super Admin" },
    create: { slug: "super_admin", name: "Super Admin", isSystem: true },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: "admin" },
    update: { name: "Admin" },
    create: { slug: "admin", name: "Admin", isSystem: true },
  });

  const staffRole = await prisma.role.upsert({
    where: { slug: "staff" },
    update: { name: "Staff" },
    create: { slug: "staff", name: "Staff", isSystem: true },
  });

  // Super Admin gets all permissions
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  // Admin permissions
  const adminPermKeys = PERMISSIONS.filter(
    (p) => p.key !== "roles.manage" && p.key !== "settings.manage",
  ).map((p) => p.key);
  for (const key of adminPermKeys) {
    const perm = allPermissions.find((p) => p.key === key);
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // 4. Departments
  const deptsData = [
    { code: "HR", name: "Human Resources", description: "People, culture & talent operations" },
    { code: "ENG", name: "Engineering & Tech", description: "Software development and tech systems" },
    { code: "OPS", name: "Operations", description: "Facilities, office & operational logistics" },
    { code: "SALES", name: "Sales & Marketing", description: "Client acquisition and brand growth" },
    { code: "FIN", name: "Finance & Accounts", description: "Financial management, payroll & compliance" },
  ];

  const depts: Record<string, { id: string; name: string }> = {};
  for (const d of deptsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: { ...d, status: "active" },
    });
    depts[d.code] = dept;
  }

  // 5. Staff Categories
  const catsData = [
    { name: "Permanent", description: "Full-time permanent staff" },
    { name: "Contract", description: "Fixed-term contractual associates" },
    { name: "Intern", description: "Paid internship trainees" },
    { name: "Daily Wage", description: "Day-to-day engagement workforce" },
  ];

  const cats: Record<string, { id: string; name: string }> = {};
  for (const c of catsData) {
    const cat = await prisma.staffCategory.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: { ...c, status: "active" },
    });
    cats[c.name] = cat;
  }

  // 6. Detailed Staff Members
  const staffMembers = [
    {
      staffCode: "STAFF-00001",
      fullName: "Rahul Sharma",
      deptCode: "ENG",
      categoryName: "Permanent",
      designation: "Senior Full Stack Developer",
      salaryAmount: 85000,
      paymentType: "monthly" as const,
      email: "rahul.sharma@aimhop.com",
      mobile: "+91 98765 43210",
      bankName: "HDFC Bank",
      accountNumber: "50100492817261",
      ifsc: "HDFC0001234",
      upiId: "rahul@hdfcbank",
      joiningDate: new Date("2024-01-15"),
      dateOfBirth: new Date("1993-06-14"),
      gender: "male",
      address: "B-402, Green Park Apartments, Bengaluru, Karnataka",
    },
    {
      staffCode: "STAFF-00002",
      fullName: "Priya Patel",
      deptCode: "HR",
      categoryName: "Permanent",
      designation: "HR Manager",
      salaryAmount: 62000,
      paymentType: "monthly" as const,
      email: "priya.patel@aimhop.com",
      mobile: "+91 98123 45678",
      bankName: "ICICI Bank",
      accountNumber: "002105829104",
      ifsc: "ICIC0000021",
      upiId: "priya@icici",
      joiningDate: new Date("2024-02-01"),
      dateOfBirth: new Date("1995-11-20"),
      gender: "female",
      address: "12, Shanti Kunj, Ahmedabad, Gujarat",
    },
    {
      staffCode: "STAFF-00003",
      fullName: "Amit Kumar",
      deptCode: "OPS",
      categoryName: "Permanent",
      designation: "Operations Executive",
      salaryAmount: 42000,
      paymentType: "monthly" as const,
      email: "amit.kumar@aimhop.com",
      mobile: "+91 97234 56789",
      bankName: "State Bank of India",
      accountNumber: "38291048291",
      ifsc: "SBIN0004567",
      upiId: "amit@sbi",
      joiningDate: new Date("2024-03-10"),
      dateOfBirth: new Date("1998-03-05"),
      gender: "male",
      address: "Plot 88, Sector 15, Gurgaon, Haryana",
    },
    {
      staffCode: "STAFF-00004",
      fullName: "Sneha Reddy",
      deptCode: "SALES",
      categoryName: "Permanent",
      designation: "Business Development Lead",
      salaryAmount: 58000,
      paymentType: "monthly" as const,
      email: "sneha.reddy@aimhop.com",
      mobile: "+91 99345 67890",
      bankName: "Axis Bank",
      accountNumber: "918020048291048",
      ifsc: "UTIB0000123",
      upiId: "sneha@axisbank",
      joiningDate: new Date("2024-04-01"),
      dateOfBirth: new Date("1996-08-22"),
      gender: "female",
      address: "7-2-19, Banjara Hills, Hyderabad, Telangana",
    },
    {
      staffCode: "STAFF-00005",
      fullName: "Vikram Singh",
      deptCode: "FIN",
      categoryName: "Permanent",
      designation: "Senior Accountant",
      salaryAmount: 54000,
      paymentType: "monthly" as const,
      email: "vikram.singh@aimhop.com",
      mobile: "+91 98456 78901",
      bankName: "Kotak Mahindra Bank",
      accountNumber: "4829103829",
      ifsc: "KKBK0000456",
      upiId: "vikram@kotak",
      joiningDate: new Date("2024-04-15"),
      dateOfBirth: new Date("1992-12-10"),
      gender: "male",
      address: "C-14, Vaishali Nagar, Jaipur, Rajasthan",
    },
    {
      staffCode: "STAFF-00006",
      fullName: "Neha Gupta",
      deptCode: "ENG",
      categoryName: "Permanent",
      designation: "UI/UX Designer",
      salaryAmount: 50000,
      paymentType: "monthly" as const,
      email: "neha.gupta@aimhop.com",
      mobile: "+91 96567 89012",
      bankName: "HDFC Bank",
      accountNumber: "50100829103948",
      ifsc: "HDFC0001234",
      upiId: "neha@okhdfcbank",
      joiningDate: new Date("2024-06-01"),
      dateOfBirth: new Date("1997-04-18"),
      gender: "female",
      address: "Tower 4, Flat 1002, Noida Sector 62, Uttar Pradesh",
    },
    {
      staffCode: "STAFF-00007",
      fullName: "Arjun Mehta",
      deptCode: "ENG",
      categoryName: "Contract",
      designation: "DevOps & Cloud Specialist",
      salaryAmount: 72000,
      paymentType: "monthly" as const,
      email: "arjun.mehta@aimhop.com",
      mobile: "+91 95678 90123",
      bankName: "ICICI Bank",
      accountNumber: "004928194820",
      ifsc: "ICIC0000021",
      upiId: "arjun@icici",
      joiningDate: new Date("2024-07-01"),
      dateOfBirth: new Date("1994-09-30"),
      gender: "male",
      address: "A-501, Powai Heights, Mumbai, Maharashtra",
    },
    {
      staffCode: "STAFF-00008",
      fullName: "Pooja Verma",
      deptCode: "SALES",
      categoryName: "Intern",
      designation: "Marketing Intern",
      salaryAmount: 18000,
      paymentType: "monthly" as const,
      email: "pooja.verma@aimhop.com",
      mobile: "+91 94789 01234",
      bankName: "Punjab National Bank",
      accountNumber: "19280001928374",
      ifsc: "PUNB0019283",
      upiId: "pooja@pnb",
      joiningDate: new Date("2025-01-05"),
      dateOfBirth: new Date("2001-02-15"),
      gender: "female",
      address: "D-22, Model Town, Delhi",
    },
  ];

  const createdStaff: Record<string, { id: string; fullName: string; staffCode: string; salaryAmount: number }> = {};

  for (const s of staffMembers) {
    const deptId = depts[s.deptCode]?.id;
    const catId = cats[s.categoryName]?.id;
    if (!deptId || !catId) continue;

    const row = await prisma.staff.upsert({
      where: { staffCode: s.staffCode },
      update: {
        fullName: s.fullName,
        salaryAmount: s.salaryAmount,
        paymentType: s.paymentType,
        designation: s.designation,
        mobile: s.mobile,
        email: s.email,
        bankName: s.bankName,
        accountNumber: s.accountNumber,
        ifsc: s.ifsc,
        upiId: s.upiId,
        dateOfBirth: s.dateOfBirth,
        departmentId: deptId,
        categoryId: catId,
        status: "active",
      },
      create: {
        staffCode: s.staffCode,
        fullName: s.fullName,
        departmentId: deptId,
        categoryId: catId,
        designation: s.designation,
        salaryAmount: s.salaryAmount,
        paymentType: s.paymentType,
        email: s.email,
        mobile: s.mobile,
        bankName: s.bankName,
        accountNumber: s.accountNumber,
        ifsc: s.ifsc,
        upiId: s.upiId,
        joiningDate: s.joiningDate,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        address: s.address,
        status: "active",
      },
    });
    createdStaff[s.staffCode] = {
      id: row.id,
      fullName: row.fullName,
      staffCode: row.staffCode,
      salaryAmount: s.salaryAmount,
    };
  }

  // 7. Users
  const superAdminHash = await bcrypt.hash("Admin@123", 12);
  const demoHash = await bcrypt.hash("Demo@123", 12);
  const staffHash = await bcrypt.hash("Staff@123", 12);

  // Super Admin
  await prisma.user.upsert({
    where: { email: "superadmin@aimhop.com" },
    update: { passwordHash: superAdminHash, roleId: superAdminRole.id, isActive: true },
    create: {
      email: "superadmin@aimhop.com",
      passwordHash: superAdminHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  // Demo Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "demo@aimhop.com" },
    update: { passwordHash: demoHash, roleId: adminRole.id, isActive: true },
    create: {
      email: "demo@aimhop.com",
      passwordHash: demoHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Demo Staff user (linked to Rahul Sharma - STAFF-00001)
  const rahulStaff = createdStaff["STAFF-00001"];
  await prisma.user.upsert({
    where: { email: "staff@aimhop.com" },
    update: {
      passwordHash: staffHash,
      roleId: staffRole.id,
      staffId: rahulStaff?.id ?? null,
      isActive: true,
    },
    create: {
      email: "staff@aimhop.com",
      passwordHash: staffHash,
      roleId: staffRole.id,
      staffId: rahulStaff?.id ?? null,
      isActive: true,
    },
  });

  // Clean up old .local user if present
  await prisma.user.deleteMany({ where: { email: "superadmin@aimhop.local" } });

  // 8. Attendance Records (Past 3 days + Today)
  const now = new Date();
  const todayUtc = getUtcMidnight(now);

  const daysToSeed = [
    { date: todayUtc, label: "today" },
    { date: new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000), label: "yesterday" },
    { date: new Date(todayUtc.getTime() - 2 * 24 * 60 * 60 * 1000), label: "2 days ago" },
    { date: new Date(todayUtc.getTime() - 3 * 24 * 60 * 60 * 1000), label: "3 days ago" },
  ];

  const todayStatusMap: Record<string, "present" | "absent" | "leave" | "half_day"> = {
    "STAFF-00001": "present",
    "STAFF-00002": "present",
    "STAFF-00003": "present",
    "STAFF-00004": "present",
    "STAFF-00005": "absent",
    "STAFF-00006": "present",
    "STAFF-00007": "leave",
    "STAFF-00008": "half_day",
  };

  for (const day of daysToSeed) {
    for (const [code, staff] of Object.entries(createdStaff)) {
      let status: "present" | "absent" | "leave" | "half_day" = "present";
      if (day.label === "today") {
        status = todayStatusMap[code] ?? "present";
      } else if (code === "STAFF-00005" && day.label === "yesterday") {
        status = "leave";
      }

      await prisma.attendanceRecord.upsert({
        where: {
          staffId_date: { staffId: staff.id, date: day.date },
        },
        update: { status, markedById: adminUser.id },
        create: {
          staffId: staff.id,
          date: day.date,
          status,
          markedById: adminUser.id,
          note: status === "leave" ? "Approved medical leave" : status === "half_day" ? "Morning college exam" : null,
        },
      });
    }
  }

  // 9. Payments & Receipts
  const currentPeriodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevPeriodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const currentMonthLabel = currentPeriodMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const prevMonthLabel = prevPeriodMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  const paymentItems = [
    {
      staffCode: "STAFF-00001",
      deptName: "Engineering & Tech",
      amount: 85000,
      periodMonth: currentPeriodMonth,
      periodLabel: currentMonthLabel,
      paymentKind: "salary" as const,
      paymentMethod: "bank_transfer" as const,
      receiptNumber: "PAY-2026-00001",
      note: "Full monthly salary",
    },
    {
      staffCode: "STAFF-00002",
      deptName: "Human Resources",
      amount: 62000,
      periodMonth: currentPeriodMonth,
      periodLabel: currentMonthLabel,
      paymentKind: "salary" as const,
      paymentMethod: "bank_transfer" as const,
      receiptNumber: "PAY-2026-00002",
      note: "Full monthly salary",
    },
    {
      staffCode: "STAFF-00003",
      deptName: "Operations",
      amount: 42000,
      periodMonth: currentPeriodMonth,
      periodLabel: currentMonthLabel,
      paymentKind: "salary" as const,
      paymentMethod: "upi" as const,
      receiptNumber: "PAY-2026-00003",
      note: "Monthly salary via UPI",
    },
    {
      staffCode: "STAFF-00004",
      deptName: "Sales & Marketing",
      amount: 30000,
      periodMonth: currentPeriodMonth,
      periodLabel: currentMonthLabel,
      paymentKind: "partial" as const,
      paymentMethod: "bank_transfer" as const,
      receiptNumber: "PAY-2026-00004",
      note: "First installment salary payment",
    },
    {
      staffCode: "STAFF-00006",
      deptName: "Engineering & Tech",
      amount: 20000,
      periodMonth: currentPeriodMonth,
      periodLabel: currentMonthLabel,
      paymentKind: "advance" as const,
      paymentMethod: "upi" as const,
      receiptNumber: "PAY-2026-00005",
      note: "Advance payment against salary",
    },
    {
      staffCode: "STAFF-00001",
      deptName: "Engineering & Tech",
      amount: 85000,
      periodMonth: prevPeriodMonth,
      periodLabel: prevMonthLabel,
      paymentKind: "salary" as const,
      paymentMethod: "bank_transfer" as const,
      receiptNumber: "PAY-2026-00006",
      note: "Previous month full salary",
    },
    {
      staffCode: "STAFF-00002",
      deptName: "Human Resources",
      amount: 62000,
      periodMonth: prevPeriodMonth,
      periodLabel: prevMonthLabel,
      paymentKind: "salary" as const,
      paymentMethod: "bank_transfer" as const,
      receiptNumber: "PAY-2026-00007",
      note: "Previous month full salary",
    },
  ];

  for (const item of paymentItems) {
    const s = createdStaff[item.staffCode];
    if (!s) continue;

    // Check if receipt already exists
    const existingReceipt = await prisma.paymentReceipt.findUnique({
      where: { receiptNumber: item.receiptNumber },
    });

    if (!existingReceipt) {
      const payment = await prisma.payment.create({
        data: {
          staffId: s.id,
          amount: item.amount,
          periodMonth: item.periodMonth,
          paymentDate: new Date(),
          paymentMethod: item.paymentMethod,
          paymentKind: item.paymentKind,
          note: item.note,
          createdById: adminUser.id,
        },
      });

      await prisma.paymentReceipt.create({
        data: {
          receiptNumber: item.receiptNumber,
          paymentId: payment.id,
          companyName: company.legalName || company.name,
          employeeName: s.fullName,
          staffCode: s.staffCode,
          departmentName: item.deptName,
          periodLabel: item.periodLabel,
          amountPaid: item.amount,
          paymentMethod: item.paymentMethod,
          authorizedBy: "Accounts Department",
          issuedById: adminUser.id,
        },
      });
    }
  }

  // Set sequence
  await prisma.receiptSequence.upsert({
    where: { year: 2026 },
    update: { lastNumber: 7 },
    create: { year: 2026, lastNumber: 7 },
  });

  // 10. Audit Logs
  const auditEntries = [
    { action: "auth.login", entityType: "user", targetLabel: "demo@aimhop.com", actorUserId: adminUser.id },
    { action: "attendance.mark", entityType: "attendance", targetLabel: "8 staff marked for today", actorUserId: adminUser.id },
    { action: "payments.create", entityType: "payment", targetLabel: "Rahul Sharma - ₹85,000", actorUserId: adminUser.id },
    { action: "payments.create", entityType: "payment", targetLabel: "Sneha Reddy - ₹30,000 (Partial)", actorUserId: adminUser.id },
    { action: "staff.create", entityType: "staff", targetLabel: "STAFF-00008 Pooja Verma", actorUserId: adminUser.id },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        targetLabel: entry.targetLabel,
        ip: "127.0.0.1",
      },
    });
  }

  console.log("Seed complete with rich mock data!");
  console.log("  Company:", company.name);
  console.log("  Staff members:", Object.keys(createdStaff).length);
  console.log("  Demo Admin: demo@aimhop.com / Demo@123");
  console.log("  Super Admin: superadmin@aimhop.com / Admin@123");
  console.log("  Demo Staff: staff@aimhop.com / Staff@123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
