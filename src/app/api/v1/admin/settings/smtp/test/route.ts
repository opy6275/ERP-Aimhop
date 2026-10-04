import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { testSmtpConnection } from "@/lib/email";

const testSchema = z.object({
  testEmail: z.string().email("Please provide a valid test recipient email address"),
});

export async function POST(request: Request) {
  const user = await requirePermission("settings.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid email address", 400);
  }

  const result = await testSmtpConnection(parsed.data.testEmail);

  if (!result.success) {
    return apiError("SMTP_ERROR", result.error || "Failed to verify SMTP connection", 400);
  }

  return apiOk({ message: result.message });
}
