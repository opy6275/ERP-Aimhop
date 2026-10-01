import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encodeSession, sessionCookieOptions } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { rateLimit } from "@/lib/security";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().min(1, "Please enter your email or username"),
  password: z.string().min(1, "Please enter your password"),
  roleMode: z.enum(["admin", "staff"]).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`login:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return apiError("RATE_LIMITED", "Too many login attempts. Try again shortly.", 429);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid login input", 400);
  }

  const { email: identifier, password, roleMode } = parsed.data;
  const rawQuery = identifier.trim();

  try {
    // Look up user by email directly or by linked staff code
    const isEmail = rawQuery.includes("@");
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawQuery.toLowerCase() },
          ...(!isEmail
            ? [
                { staff: { staffCode: rawQuery.toUpperCase() } },
                { staff: { email: rawQuery.toLowerCase() } },
              ]
            : []),
        ],
      },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
        staff: true,
      },
    });

    if (!user || !user.isActive) {
      return apiError("UNAUTHORIZED", "Invalid email, username or password", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return apiError("UNAUTHORIZED", "Invalid email, username or password", 401);
    }

    // Role-mode enforcement
    if (roleMode === "admin" && user.role.slug === "staff") {
      return apiError(
        "FORBIDDEN",
        "Access denied: This account is registered as Staff. Please switch to the Staff Login tab to access your employee portal.",
        403,
      );
    }

    if (roleMode === "staff" && user.role.slug !== "staff") {
      return apiError(
        "FORBIDDEN",
        "Access denied: This account holds Administrator credentials. Please switch to the Admin Login tab to access the management portal.",
        403,
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const redirectTo =
      user.role.slug === "staff" ? "/app/dashboard" : "/admin/dashboard";

    const token = await encodeSession({
      userId: user.id,
      email: user.email,
      role: user.role.slug,
      staffId: user.staffId,
    });

    await writeAudit({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      targetLabel: `${user.email} (${user.role.slug}) via ${roleMode ?? "direct"}`,
      ip,
    });

    const res = apiOk({
      message: `Welcome back, ${user.role.name}`,
      role: user.role.slug,
      permissions: user.role.permissions.map((p) => p.permission.key),
      redirectTo,
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (err: unknown) {
    console.error("Login route error:", err);
    return apiError(
      "SERVICE_UNAVAILABLE",
      "Database service unavailable. Please try again shortly.",
      503,
    );
  }
}
