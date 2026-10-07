import bcrypt from "bcryptjs";
import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const credentialsSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  isActive: z.boolean().default(true),
});

const statusToggleSchema = z.object({
  isActive: z.boolean(),
});

// GET: Check staff portal credentials
export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requirePermission("staff.read");
  if (isErrorResponse(admin)) return admin;
  const { id } = await ctx.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    select: {
      id: true,
      staffCode: true,
      fullName: true,
      email: true,
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!staff) return notFound();

  return apiOk({
    hasLogin: Boolean(staff.user),
    user: staff.user,
    suggestedEmail: staff.user?.email || staff.email,
  });
}

// POST: Create or Reset Login Credentials
export async function POST(request: Request, ctx: Ctx) {
  const admin = await requirePermission("users.manage");
  if (isErrorResponse(admin)) return admin;
  const { id } = await ctx.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!staff) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid credentials data", 400);
  }

  const { password, isActive } = parsed.data;
  const loginEmail = (parsed.data.email || staff.user?.email || staff.email)?.trim().toLowerCase();

  if (!loginEmail) {
    return apiError("VALIDATION_ERROR", "Login Email address is required.", 400);
  }

  if (!staff.user && (!password || password.trim().length < 6)) {
    return apiError("VALIDATION_ERROR", "Password must be at least 6 characters for a new login account.", 400);
  }

  // Check if another user already has this email
  const existingEmailUser = await prisma.user.findFirst({
    where: {
      email: loginEmail,
      NOT: staff.user ? { id: staff.user.id } : undefined,
    },
  });

  if (existingEmailUser) {
    return apiError("CONFLICT", `User with email "${loginEmail}" already exists.`, 400);
  }

  const staffRole = await prisma.role.findUnique({ where: { slug: "staff" } });
  if (!staffRole) {
    return apiError("INTERNAL_ERROR", "Staff role not configured in system", 500);
  }

  const passwordHash = password?.trim() ? await bcrypt.hash(password.trim(), 10) : undefined;

  if (staff.user) {
    // Update existing user password & details
    const updatedUser = await prisma.user.update({
      where: { id: staff.user.id },
      data: {
        email: loginEmail,
        ...(passwordHash
          ? { passwordHash, tokenVersion: { increment: 1 } as unknown as number }
          : {}),
        isActive,
      },
      select: { id: true, email: true, isActive: true, lastLoginAt: true },
    });

    await writeAudit({
      actorUserId: admin.id,
      action: "user.update",
      entityType: "user",
      entityId: updatedUser.id,
      targetLabel: `${staff.staffCode} password reset`,
    });

    return apiOk({
      success: true,
      message: "Password updated successfully!",
      user: updatedUser,
      actionTaken: "reset",
    });
  } else {
    if (!passwordHash) {
      return apiError("VALIDATION_ERROR", "Password is required for a new account.", 400);
    }

    // Create new login account for this staff
    const newUser = await prisma.user.create({
      data: {
        email: loginEmail,
        passwordHash,
        roleId: staffRole.id,
        staffId: staff.id,
        isActive,
      },
      select: { id: true, email: true, isActive: true, lastLoginAt: true },
    });

    await writeAudit({
      actorUserId: admin.id,
      action: "user.create",
      entityType: "user",
      entityId: newUser.id,
      targetLabel: `${staff.staffCode} login created (${loginEmail})`,
    });

    return apiOk({
      success: true,
      message: "Portal login account created successfully!",
      user: newUser,
      actionTaken: "created",
    }, 201);
  }
}

// PATCH: Toggle Active / Inactive
export async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requirePermission("users.manage");
  if (isErrorResponse(admin)) return admin;
  const { id } = await ctx.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!staff || !staff.user) {
    return apiError("NOT_FOUND", "No portal login found for this employee to update status", 404);
  }

  const body = await request.json().catch(() => null);
  const parsed = statusToggleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid status toggle payload", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: staff.user.id },
    data: { isActive: parsed.data.isActive },
    select: { id: true, email: true, isActive: true },
  });

  await writeAudit({
    actorUserId: admin.id,
    action: "user.update",
    entityType: "user",
    entityId: updatedUser.id,
    targetLabel: `${staff.staffCode} login ${updatedUser.isActive ? "activated" : "deactivated"}`,
  });

  return apiOk({
    success: true,
    message: `Staff login ${updatedUser.isActive ? "activated" : "disabled"} successfully.`,
    user: updatedUser,
  });
}

// DELETE: Revoke portal login
export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requirePermission("users.manage");
  if (isErrorResponse(admin)) return admin;
  const { id } = await ctx.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!staff || !staff.user) {
    return apiError("NOT_FOUND", "No portal login account exists for this employee", 404);
  }

  const userId = staff.user.id;
  await prisma.$transaction([
    prisma.auditLog.updateMany({
      where: { actorUserId: userId },
      data: { actorUserId: null },
    }),
    prisma.attendanceRecord.updateMany({
      where: { markedById: userId },
      data: { markedById: null },
    }),
    prisma.leaveRequest.updateMany({
      where: { reviewedById: userId },
      data: { reviewedById: null },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await writeAudit({
    actorUserId: admin.id,
    action: "user.delete",
    entityType: "user",
    entityId: userId,
    targetLabel: `${staff.staffCode} login credentials revoked`,
  });

  return apiOk({
    success: true,
    message: "Staff portal login credentials have been revoked.",
  });
}
