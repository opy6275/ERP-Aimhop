import bcrypt from "bcryptjs";
import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
});

export async function POST(request: Request) {
  const admin = await requirePermission("settings.manage");
  if (isErrorResponse(admin)) return admin;

  const body = await request.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return apiError("VALIDATION_ERROR", "New password and confirm password do not match.", 400);
  }

  // Fetch current admin user
  const user = await prisma.user.findUnique({
    where: { id: admin.id },
  });

  if (!user) {
    return apiError("NOT_FOUND", "Admin user account not found.", 404);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return apiError("UNAUTHORIZED", "Your current password does not match. Please verify and try again.", 401);
  }

  // Hash new password and update
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  await writeAudit({
    actorUserId: admin.id,
    action: "user.password_change",
    entityType: "user",
    entityId: user.id,
    targetLabel: `Admin password changed (${user.email})`,
  });

  return apiOk({
    success: true,
    message: "Admin password changed successfully.",
  });
}
