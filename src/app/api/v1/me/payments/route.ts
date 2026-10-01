import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { computePeriodBalance } from "@/lib/domain";
import { decimalToNumber, parsePeriodMonth } from "@/lib/format";

export async function GET(request: Request) {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const periodMonth = month ? parsePeriodMonth(month) : null;

  const staff = await prisma.staff.findUnique({ where: { id: user.staffId } });
  if (!staff) return apiOk({ payments: [], balance: null, salaryAmount: 0 });

  const payments = await prisma.payment.findMany({
    where: {
      staffId: user.staffId,
      ...(periodMonth ? { periodMonth } : {}),
    },
    orderBy: { paymentDate: "desc" },
    include: { receipt: { select: { id: true, receiptNumber: true } } },
  });

  const balance = periodMonth
    ? computePeriodBalance(
        decimalToNumber(staff.salaryAmount),
        payments.map((p) => ({ amount: p.amount, paymentKind: p.paymentKind })),
      )
    : null;

  return apiOk({
    salaryAmount: decimalToNumber(staff.salaryAmount),
    paymentType: staff.paymentType,
    balance,
    payments: payments.map((p) => ({
      ...p,
      amount: decimalToNumber(p.amount),
    })),
  });
}
