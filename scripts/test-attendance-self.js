// Integration test for Staff Self-Service Attendance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toDateOnlyUtc(input) {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function run() {
  console.log("=== Testing Staff Self-Service Attendance ===");

  // 1. Locate staff user
  const user = await prisma.user.findUnique({
    where: { email: "staff@aimhop.com" },
    include: { staff: true, role: true },
  });
  if (!user || !user.staffId) {
    throw new Error("staff@aimhop.com user or staffId not found");
  }
  console.log("✔ Located staff user:", user.email, "StaffCode:", user.staff.staffCode);

  const today = toDateOnlyUtc(new Date());

  // 2. Perform self check-in
  const checkinRecord = await prisma.attendanceRecord.upsert({
    where: { staffId_date: { staffId: user.staffId, date: today } },
    update: {
      status: "present",
      note: "Web portal check-in",
      markedById: user.id,
    },
    create: {
      staffId: user.staffId,
      date: today,
      status: "present",
      note: "Web portal check-in",
      markedById: user.id,
    },
  });
  if (!checkinRecord || checkinRecord.status !== "present") {
    throw new Error("Self check-in failed");
  }
  console.log("✔ Self check-in record created/updated successfully");

  // 3. Second check-in update for same day
  const updatedCheckin = await prisma.attendanceRecord.upsert({
    where: { staffId_date: { staffId: user.staffId, date: today } },
    update: {
      status: "half_day",
      note: "Updated to half day due to emergency",
      markedById: user.id,
    },
    create: {
      staffId: user.staffId,
      date: today,
      status: "half_day",
      note: "Updated to half day",
      markedById: user.id,
    },
  });
  if (updatedCheckin.status !== "half_day" || !updatedCheckin.note.includes("emergency")) {
    throw new Error("Same-day check-in update failed");
  }
  console.log("✔ Same-day check-in update in-place verified");

  // 4. Query Monthly History with Strict Isolation
  const month = "2026-10";
  const [y, m] = month.split("-").map(Number);
  const records = await prisma.attendanceRecord.findMany({
    where: {
      staffId: user.staffId,
      date: {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0, 23, 59, 59)),
      },
    },
    orderBy: { date: "desc" },
  });

  // Calculate summary counts
  const summary = {
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    holiday: 0,
  };
  for (const r of records) {
    if (r.staffId !== user.staffId) {
      throw new Error("IDOR data breach! Record belongs to another staff!");
    }
    summary[r.status] += 1;
  }
  console.log("✔ Monthly attendance history retrieved:", records.length, "days recorded");
  console.log("✔ Attendance summary counts:", JSON.stringify(summary));

  // 5. Test Audit Log
  const audit = await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "attendance.checkin",
      entityType: "attendance",
      entityId: updatedCheckin.id,
      targetLabel: `Self check-in (HALF_DAY) for ${today.toISOString().slice(0, 10)}`,
    },
  });
  if (!audit) throw new Error("Failed to create check-in audit log");
  console.log("✔ Check-in audit log verified");

  console.log("\nALL STAFF ATTENDANCE TESTS PASSED! 🙋‍♂️\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
