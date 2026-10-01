import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export async function GET() {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const receipts = await prisma.paymentReceipt.findMany({
    where: { payment: { staffId: user.staffId } },
    orderBy: { issuedAt: "desc" },
  });

  return apiOk({
    receipts: receipts.map((r) => ({
      ...r,
      amountPaid: decimalToNumber(r.amountPaid),
    })),
  });
}
