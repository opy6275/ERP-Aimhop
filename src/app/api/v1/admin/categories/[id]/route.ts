import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requirePermission("categories.manage");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid data", 400);

  const existing = await prisma.staffCategory.findUnique({ where: { id } });
  if (!existing) return notFound();

  const category = await prisma.staffCategory.update({ where: { id }, data: parsed.data });
  await writeAudit({
    actorUserId: user.id,
    action: "category.update",
    entityType: "category",
    entityId: category.id,
    targetLabel: category.name,
    changes: parsed.data,
  });
  return apiOk({ category });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requirePermission("categories.manage");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const existing = await prisma.staffCategory.findUnique({
    where: { id },
    include: { _count: { select: { staff: true } } },
  });
  if (!existing) return notFound();

  if (existing._count.staff > 0) {
    return apiError(
      "CONFLICT",
      `Cannot delete category '${existing.name}' because ${existing._count.staff} employee(s) are assigned to it. Please reassign them first.`,
      400,
    );
  }

  await prisma.staffCategory.delete({ where: { id } });

  await writeAudit({
    actorUserId: user.id,
    action: "category.delete",
    entityType: "category",
    entityId: id,
    targetLabel: existing.name,
  });

  return apiOk({ success: true, message: "Category deleted successfully" });
}

