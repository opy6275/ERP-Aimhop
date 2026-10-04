import { z } from "zod";
import bcrypt from "bcryptjs";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  email: z.string().email().optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  staffId: z.string().optional().nullable(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requirePermission("users.manage");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid update payload", 400, {
      detail: parsed.error.issues[0]?.message,
    });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return notFound();

  const d = parsed.data;
  const updateData: {
    email?: string;
    roleId?: string;
    isActive?: boolean;
    passwordHash?: string;
    staffId?: string | null;
  } = {};

  if (d.email && d.email.toLowerCase() !== existing.email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email: d.email.toLowerCase() },
    });
    if (emailConflict) {
      return apiError("CONFLICT", `User with email "${d.email}" already exists.`, 400);
    }
    updateData.email = d.email.toLowerCase();
  }

  if (d.roleId) updateData.roleId = d.roleId;
  if (d.isActive !== undefined) updateData.isActive = d.isActive;
  if (d.staffId !== undefined) updateData.staffId = d.staffId;
  if (d.password) {
    updateData.passwordHash = await bcrypt.hash(d.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      role: true,
      staff: { select: { id: true, staffCode: true, fullName: true } },
    },
  });

  await writeAudit({
    actorUserId: user.id,
    action: "user.update",
    entityType: "user",
    entityId: updated.id,
    targetLabel: updated.email,
    changes: { roleId: d.roleId, isActive: d.isActive, passwordUpdated: Boolean(d.password) },
  });

  return apiOk({
    user: {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      staff: updated.staff,
      isActive: updated.isActive,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requirePermission("users.manage");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  if (user.id === id) {
    return apiError("BAD_REQUEST", "You cannot delete your own logged-in user account.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return notFound();

  await prisma.user.delete({ where: { id } });

  await writeAudit({
    actorUserId: user.id,
    action: "user.delete",
    entityType: "user",
    entityId: id,
    targetLabel: existing.email,
  });

  return apiOk({ success: true, message: "User account deleted successfully" });
}
