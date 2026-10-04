import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { getSmtpSettings, saveSmtpSettings } from "@/lib/email";
import { writeAudit } from "@/lib/audit";

const updateSmtpSchema = z.object({
  host: z.string().min(1, "SMTP Host is required"),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean().default(true),
  user: z.string().min(1, "Username / Email is required"),
  pass: z.string().optional(),
  fromEmail: z.string().email("Invalid sender email").or(z.string().min(1)),
  fromName: z.string().min(1).default("AimHop ERP Payroll"),
  replyTo: z.string().optional().nullable(),
  isEnabled: z.boolean().default(true),
});

export async function GET() {
  const user = await requirePermission("settings.manage");
  if (isErrorResponse(user)) return user;

  const config = await getSmtpSettings();

  return apiOk({
    smtp: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      hasPassword: Boolean(config.pass && config.pass.length > 0),
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyTo: config.replyTo,
      isEnabled: config.isEnabled,
    },
  });
}

export async function PUT(request: Request) {
  const user = await requirePermission("settings.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = updateSmtpSchema.safeParse(body);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((e) => e.message).join(", ");
    return apiError("VALIDATION_ERROR", errorDetails || "Invalid SMTP configuration", 400);
  }

  const d = parsed.data;
  await saveSmtpSettings({
    host: d.host,
    port: d.port,
    secure: d.secure,
    user: d.user,
    pass: d.pass,
    fromEmail: d.fromEmail,
    fromName: d.fromName,
    replyTo: d.replyTo || undefined,
    isEnabled: d.isEnabled,
  });

  await writeAudit({
    actorUserId: user.id,
    action: "settings.smtp_update",
    entityType: "settings",
    targetLabel: `${d.host}:${d.port} (${d.user})`,
  });

  return apiOk({ message: "SMTP configuration updated successfully" });
}
