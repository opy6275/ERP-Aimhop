import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encodeSession, sessionCookieOptions } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { rateLimit } from "@/lib/security";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return apiError("VALIDATION_ERROR", "Enter a valid email and password", 400);
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user || !user.isActive) {
      return apiError("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return apiError("UNAUTHORIZED", "Invalid email or password", 401);
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
      targetLabel: user.email,
      ip,
    });

    const res = apiOk({
      message: `Welcome, ${user.role.name}`,
      role: user.role.slug,
      permissions: user.role.permissions.map((p) => p.permission.key),
      redirectTo,
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch {
    return apiError(
      "SERVICE_UNAVAILABLE",
      "Database unavailable. Run prisma db push and db:seed.",
      503,
    );
  }
}
