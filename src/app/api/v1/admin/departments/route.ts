import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

const createSchema = z.object({
  code: z.string().min(1).max(20).optional().nullable(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  headStaffId: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET() {
  const user = await requirePermission("departments.read");
  if (isErrorResponse(user)) return user;

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { staff: { where: { status: "active" } } } },
    },
  });

  const headIds = departments
    .map((d) => d.headStaffId)
    .filter((id): id is string => Boolean(id));

  const heads = headIds.length > 0
    ? await prisma.staff.findMany({
        where: { id: { in: headIds } },
        select: {
          id: true,
          fullName: true,
          staffCode: true,
          designation: true,
          photoUrl: true,
          email: true,
        },
      })
    : [];

  const headMap = new Map(heads.map((h) => [h.id, h]));

  return apiOk({
    departments: departments.map((d) => ({
      ...d,
      activeStaffCount: d._count.staff,
      headStaff: d.headStaffId ? headMap.get(d.headStaffId) || null : null,
      _count: undefined,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requirePermission("departments.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid department data", 400);
  }

  const data = parsed.data;
  const dept = await prisma.department.create({
    data: {
      code: data.code || null,
      name: data.name,
      description: data.description || null,
      headStaffId: data.headStaffId || null,
      status: data.status,
    },
  });

  await writeAudit({
    actorUserId: user.id,
    action: "department.create",
    entityType: "department",
    entityId: dept.id,
    targetLabel: dept.name,
  });

  return apiOk({ department: dept }, 201);
}
