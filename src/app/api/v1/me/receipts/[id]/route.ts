import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const { id } = await ctx.params;
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id },
    include: { payment: { select: { staffId: true } } },
  });

  // IDOR protection: return 404 if not owner
  if (!receipt || receipt.payment.staffId !== user.staffId) {
    return notFound();
  }

  return apiOk({
    ...receipt,
    amountPaid: decimalToNumber(receipt.amountPaid),
    payment: undefined,
  });
}
