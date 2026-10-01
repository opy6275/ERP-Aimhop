import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  code: z.string().min(1).max(20).optional().nullable(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  headStaffId: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requirePermission("departments.read");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { staff: { where: { status: "active" } } } } },
  });
  if (!dept) return notFound();

  return apiOk({
    department: { ...dept, activeStaffCount: dept._count.staff, _count: undefined },
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requirePermission("departments.manage");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid data", 400);

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return notFound();

  const dept = await prisma.department.update({ where: { id }, data: parsed.data });

  await writeAudit({
    actorUserId: user.id,
    action: "department.update",
    entityType: "department",
    entityId: dept.id,
    targetLabel: dept.name,
    changes: parsed.data,
  });

  return apiOk({ department: dept });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requirePermission("departments.manage");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const existing = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { staff: true } } },
  });
  if (!existing) return notFound();

  if (existing._count.staff > 0) {
    return apiError(
      "CONFLICT",
      `Cannot delete '${existing.name}' because ${existing._count.staff} staff member(s) are assigned to it. Please reassign them first.`,
      400,
    );
  }

  await prisma.department.delete({ where: { id } });

  await writeAudit({
    actorUserId: user.id,
    action: "department.delete",
    entityType: "department",
    entityId: id,
    targetLabel: existing.name,
  });

  return apiOk({ success: true, message: "Department deleted successfully" });
}

