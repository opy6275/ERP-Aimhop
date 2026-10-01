import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { decimalToNumber, formatInr } from "@/lib/format";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requirePermission("payments.read");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      staff: { select: { id: true, staffCode: true, fullName: true } },
      receipt: true,
    },
  });
  if (!payment) return notFound();

  return apiOk({ payment });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requirePermission("payments.create");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const existing = await prisma.payment.findUnique({
    where: { id },
    include: {
      staff: { select: { staffCode: true, fullName: true } },
      receipt: { select: { receiptNumber: true } },
    },
  });
  if (!existing) return notFound();

  // Receipt will cascade delete automatically per schema
  await prisma.payment.delete({ where: { id } });

  await writeAudit({
    actorUserId: user.id,
    action: "payment.delete",
    entityType: "payment",
    entityId: id,
    targetLabel: `${existing.staff.staffCode} ${existing.staff.fullName} - ${formatInr(decimalToNumber(existing.amount))} (${existing.receipt?.receiptNumber ?? "No Receipt"})`,
  });

  return apiOk({ success: true, message: "Payment transaction voided and deleted successfully" });
}
