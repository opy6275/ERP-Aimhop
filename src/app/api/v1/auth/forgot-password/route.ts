import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api-response";
import { rateLimit } from "@/lib/security";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`forgot-password:${ip}`, 5, 60_000); // 5 attempts per minute max
  if (!rl.ok) {
    return apiError("RATE_LIMITED", "Too many requests. Please wait a minute before requesting another code.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid email format", 400);
  }

  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      staff: { select: { fullName: true } },
    },
  });

  if (!user || !user.isActive) {
    // Return friendly generic message so attackers cannot guess valid accounts
    return apiOk({
      success: true,
      message: "If an active account with this email exists, a 6-digit verification code has been dispatched.",
    });
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Save OTP hash and expiry to user
  await prisma.$executeRawUnsafe(
    `UPDATE users SET reset_otp_hash = ?, reset_otp_expires = ? WHERE id = ?`,
    otpHash,
    expiresAt.toISOString(),
    user.id
  );

  // Send Email OTP
  const emailResult = await sendPasswordResetOtpEmail(user.email, otp, user.staff?.fullName);

  await writeAudit({
    actorUserId: user.id,
    action: "auth.otp_requested",
    entityType: "user",
    entityId: user.id,
    targetLabel: `Password reset OTP generated for ${user.email}`,
  });

  return apiOk({
    success: true,
    message: `Verification code sent to ${user.email}. Check your inbox.`,
    devOtp: emailResult.devOtp, // available for testing if SMTP not active
  });
}
