import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api-response";
import { rateLimit } from "@/lib/security";
import { writeAudit } from "@/lib/audit";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    otp: z.string().length(6, "Verification code must be exactly 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`reset-password:${ip}`, 10, 60_000); // 10 attempts per minute
  if (!rl.ok) {
    return apiError("RATE_LIMITED", "Too many attempts. Please try again after a minute.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid data", 400);
  }

  const { email, otp, newPassword } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      email: string;
      is_active: number | boolean;
      reset_otp_hash: string | null;
      reset_otp_expires: string | null;
    }>
  >(
    `SELECT id, email, is_active, reset_otp_hash, reset_otp_expires FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
    normalizedEmail
  );

  const user = rows[0];

  if (!user || !user.is_active) {
    return apiError("INVALID_REQUEST", "Unable to reset password for this email.", 400);
  }

  if (!user.reset_otp_hash || !user.reset_otp_expires) {
    return apiError("NO_OTP_REQUESTED", "No active verification code found. Please request a new code first.", 400);
  }

  // Check expiry
  if (new Date() > new Date(user.reset_otp_expires)) {
    return apiError("OTP_EXPIRED", "Verification code has expired. Please request a new code.", 400);
  }

  // Verify OTP match
  const isValidOtp = await bcrypt.compare(otp.trim(), user.reset_otp_hash);
  if (!isValidOtp) {
    return apiError("INVALID_OTP", "Incorrect 6-digit verification code. Please check your email and try again.", 400);
  }

  // Hash new password and clear OTP
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$executeRawUnsafe(
    `UPDATE users SET password_hash = ?, reset_otp_hash = NULL, reset_otp_expires = NULL WHERE id = ?`,
    passwordHash,
    user.id
  );

  await writeAudit({
    actorUserId: user.id,
    action: "auth.password_reset_completed",
    entityType: "user",
    entityId: user.id,
    targetLabel: `Password successfully reset via Email OTP for ${user.email}`,
  });

  return apiOk({
    success: true,
    message: "Password has been successfully updated! You can now sign in with your new password.",
  });
}
