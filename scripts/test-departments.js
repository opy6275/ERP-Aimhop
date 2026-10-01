// Integration test for Department Management & Staff Aggregation
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("=== Testing Department Management ===");

  const testCode = "TEST-OPS-" + Math.floor(Math.random() * 1000);
  const testName = "Test Logistics Division " + Date.now();

  // 1. Create Department
  const dept = await prisma.department.create({
    data: {
      code: testCode,
      name: testName,
      description: "Handles shipping, warehouse logistics, and fulfillment.",
      status: "active",
    },
  });
  if (!dept || dept.code !== testCode) {
    throw new Error("Failed to create department");
  }
  console.log("✔ Department created successfully with code:", dept.code);

  // 2. Fetch and assert active staff count aggregation
  const deptsWithCount = await prisma.department.findMany({
    where: { id: dept.id },
    include: {
      _count: { select: { staff: { where: { status: "active" } } } },
    },
  });
  if (deptsWithCount.length !== 1 || deptsWithCount[0]._count.staff !== 0) {
    throw new Error("Department staff count mismatch: expected 0, got " + deptsWithCount[0]?._count?.staff);
  }
  console.log("✔ Active staff count aggregation query verified");

  // 3. Update Department
  const updated = await prisma.department.update({
    where: { id: dept.id },
    data: {
      description: "Updated description for test department",
      status: "inactive",
    },
  });
  if (updated.status !== "inactive" || !updated.description.includes("Updated")) {
    throw new Error("Department update failed");
  }
  console.log("✔ Department update verified");

  // 4. Duplicate code rejection
  let dupRejected = false;
  try {
    await prisma.department.create({
      data: {
        code: testCode,
        name: "Another Dept with same code",
      },
    });
  } catch (err) {
    dupRejected = true;
  }
  if (!dupRejected) {
    throw new Error("Duplicate department code was unexpectedly allowed!");
  }
  console.log("✔ Duplicate department code correctly rejected");

  // 5. Clean up test record
  await prisma.department.delete({ where: { id: dept.id } });
  console.log("✔ Test department cleaned up successfully");

  console.log("\nALL DEPARTMENT TESTS PASSED! 🏢\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
