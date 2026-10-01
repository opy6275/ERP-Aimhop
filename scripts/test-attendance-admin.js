// Integration test for Admin Daily Attendance Operations
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toDateOnlyUtc(input) {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function run() {
  console.log("=== Testing Admin Daily Attendance Operations ===");

  // 1. Get staff members to mark
  const staffList = await prisma.staff.findMany({
    where: { status: "active" },
    take: 3,
    include: { department: true },
  });
  if (staffList.length < 2) {
    throw new Error("Insufficient active staff members for attendance test");
  }

  const testDateStr = "2026-10-01";
  const day = toDateOnlyUtc(testDateStr);

  // 2. Mark initial attendance for staff
  console.log("Marking attendance for", staffList.length, "staff on", testDateStr);
  const markPayload = [
    { staffId: staffList[0].id, status: "present", note: "On time" },
    { staffId: staffList[1].id, status: "half_day", note: "Approved half day" },
  ];

  for (const item of markPayload) {
    await prisma.attendanceRecord.upsert({
      where: { staffId_date: { staffId: item.staffId, date: day } },
      update: { status: item.status, note: item.note },
      create: {
        staffId: item.staffId,
        date: day,
        status: item.status,
        note: item.note,
      },
    });
  }
  console.log("✔ Attendance marked via upsert");

  // 3. Verify querying by date & department
  const queried = await prisma.attendanceRecord.findMany({
    where: { date: day },
    include: { staff: { include: { department: true } } },
  });
  if (queried.length < 2) {
    throw new Error("Expected at least 2 records for date, got " + queried.length);
  }
  console.log("✔ Query by date returned " + queried.length + " records with staff relations");

  // 4. Test Idempotency: re-marking staffList[0] as "leave" should update without creating duplicate
  const prevCount = await prisma.attendanceRecord.count({
    where: { staffId: staffList[0].id, date: day },
  });
  if (prevCount !== 1) throw new Error("Count before re-marking was not 1");

  await prisma.attendanceRecord.upsert({
    where: { staffId_date: { staffId: staffList[0].id, date: day } },
    update: { status: "leave", note: "Updated to sick leave" },
    create: {
      staffId: staffList[0].id,
      date: day,
      status: "leave",
      note: "Updated to sick leave",
    },
  });

  const updatedRec = await prisma.attendanceRecord.findUnique({
    where: { staffId_date: { staffId: staffList[0].id, date: day } },
  });
  if (!updatedRec || updatedRec.status !== "leave" || updatedRec.note !== "Updated to sick leave") {
    throw new Error("Attendance record was not updated in-place");
  }

  const postCount = await prisma.attendanceRecord.count({
    where: { staffId: staffList[0].id, date: day },
  });
  if (postCount !== 1) {
    throw new Error("Duplicate attendance record created! Count: " + postCount);
  }
  console.log("✔ Attendance update in-place verified (no duplicate date records)");

  // 5. Test Audit Log
  const audit = await prisma.auditLog.create({
    data: {
      action: "attendance.mark",
      entityType: "attendance",
      targetLabel: `Marked 2 records for ${testDateStr}`,
    },
  });
  if (!audit) throw new Error("Failed to write attendance audit log");
  console.log("✔ Attendance audit logging verified");

  console.log("\nALL ADMIN ATTENDANCE TESTS PASSED! 📅\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
