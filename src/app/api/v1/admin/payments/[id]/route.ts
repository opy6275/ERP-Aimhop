import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk, notFound } from "@/lib/api-response";
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

  return apiOk({
    payment: {
      ...payment,
      amount: decimalToNumber(payment.amount),
      receipt: payment.receipt
        ? {
            ...payment.receipt,
            amountPaid: decimalToNumber(payment.receipt.amountPaid),
          }
        : null,
    },
  });
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

  if (existing.receipt) {
    return apiError(
      "CONFLICT",
      `Cannot hard-delete payment with official issued receipt '${existing.receipt.receiptNumber}'. To adjust or correct ledger balances, record an 'adjustment' or 'deduction' transaction instead to maintain full accounting and audit compliance.`,
      400,
    );
  }

  await prisma.payment.delete({ where: { id } });

  await writeAudit({
    actorUserId: user.id,
    action: "payment.delete",
    entityType: "payment",
    entityId: id,
    targetLabel: `${existing.staff.staffCode} ${existing.staff.fullName} - ${formatInr(decimalToNumber(existing.amount))} (No Receipt)`,
  });

  return apiOk({ success: true, message: "Payment transaction voided and deleted successfully" });
}
