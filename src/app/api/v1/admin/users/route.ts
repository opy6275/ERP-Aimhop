import { z } from "zod";
import bcrypt from "bcryptjs";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string().min(1),
  staffId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const user = await requirePermission("users.manage");
  if (isErrorResponse(user)) return user;

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: {
      role: true,
      staff: { select: { id: true, staffCode: true, fullName: true } },
    },
  });

  return apiOk({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      staff: u.staff,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requirePermission("users.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid user payload", 400, {
      detail: parsed.error.issues[0]?.message,
    });
  }

  const { email, password, roleId, staffId, isActive } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("CONFLICT", "A user account with this email address already exists.", 400);
  }

  if (staffId) {
    const staffUser = await prisma.user.findUnique({ where: { staffId } });
    if (staffUser) {
      return apiError("CONFLICT", "This staff member is already linked to another user account.", 400);
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      roleId,
      staffId: staffId || null,
      isActive,
    },
    include: {
      role: true,
      staff: { select: { id: true, staffCode: true, fullName: true } },
    },
  });

  await writeAudit({
    actorUserId: user.id,
    action: "user.create",
    entityType: "user",
    entityId: newUser.id,
    targetLabel: newUser.email,
  });

  return apiOk(
    {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        staff: newUser.staff,
        isActive: newUser.isActive,
      },
    },
    201,
  );
}
