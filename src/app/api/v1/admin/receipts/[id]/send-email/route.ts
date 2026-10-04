import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { sendSalarySlipEmail } from "@/lib/email";

const sendEmailSchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email").optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePermission("receipts.read");
  if (isErrorResponse(user)) return user;

  const { id } = await params;
  if (!id) return apiError("NOT_FOUND", "Receipt ID missing", 404);

  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id },
    select: { paymentId: true },
  });

  if (!receipt) {
    return apiError("NOT_FOUND", "Receipt not found", 404);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = sendEmailSchema.safeParse(body);
  const recipientOverride = parsed.success ? parsed.data.recipientEmail : undefined;

  const result = await sendSalarySlipEmail({
    paymentId: receipt.paymentId,
    recipientOverride,
    actorUserId: user.id,
  });

  if (!result.success) {
    if (result.unconfigured) {
      return apiError(
        "SMTP_UNCONFIGURED",
        result.error || "Email gateway is not configured yet. Configure free Gmail SMTP in Admin Settings.",
        422,
      );
    }
    return apiError("SEND_EMAIL_FAILED", result.error || "Could not deliver email", 400);
  }

  return apiOk({
    message: result.message || `Salary slip delivered to ${result.recipient}`,
    recipient: result.recipient,
  });
}
