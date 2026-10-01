// Integration test for Staff Category Management
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("=== Testing Staff Category Management ===");

  const testName = "Test Category " + Date.now();

  // 1. Create Category
  const cat = await prisma.staffCategory.create({
    data: {
      name: testName,
      description: "External specialized advisors and contract staff",
      status: "active",
    },
  });
  if (!cat || cat.name !== testName) {
    throw new Error("Failed to create staff category");
  }
  console.log("✔ Staff category created successfully:", cat.name);

  // 2. Fetch Category with staff count
  const categories = await prisma.staffCategory.findMany({
    where: { id: cat.id },
    include: { _count: { select: { staff: true } } },
  });
  if (categories.length !== 1 || categories[0]._count.staff !== 0) {
    throw new Error("Category staff count mismatch");
  }
  console.log("✔ Category query and staff count verified");

  // 3. Update Category
  const updated = await prisma.staffCategory.update({
    where: { id: cat.id },
    data: { status: "inactive" },
  });
  if (updated.status !== "inactive") {
    throw new Error("Category status update failed");
  }
  console.log("✔ Category status update verified");

  // 4. Duplicate name rejection
  let dupRejected = false;
  try {
    await prisma.staffCategory.create({
      data: { name: testName },
    });
  } catch {
    dupRejected = true;
  }
  if (!dupRejected) {
    throw new Error("Duplicate category name was unexpectedly allowed!");
  }
  console.log("✔ Duplicate category name correctly rejected");

  // 5. Clean up test category
  await prisma.staffCategory.delete({ where: { id: cat.id } });
  console.log("✔ Test category cleaned up successfully");

  console.log("\nALL CATEGORY TESTS PASSED! 🏷️\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
