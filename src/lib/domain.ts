import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export async function nextStaffCode() {
  const last = await prisma.staff.findFirst({
    orderBy: { staffCode: "desc" },
    select: { staffCode: true },
  });
  let n = 1;
  if (last?.staffCode) {
    const m = /STAFF-(\d+)/.exec(last.staffCode);
    if (m) n = Number(m[1]) + 1;
  }
  return `STAFF-${String(n).padStart(5, "0")}`;
}

export type PeriodBalance = {
  payable: number;
  paid: number;
  deductions: number;
  adjustments: number;
  netPaid: number;
  pending: number;
};

export function computePeriodBalance(
  salaryAmount: number,
  payments: { amount: unknown; paymentKind: string }[],
): PeriodBalance {
  let paid = 0;
  let deductions = 0;
  let adjustments = 0;

  for (const p of payments) {
    const amt = decimalToNumber(p.amount as { toString(): string });
    switch (p.paymentKind) {
      case "deduction":
        deductions += amt;
        break;
      case "adjustment":
        adjustments += amt;
        break;
      default:
        paid += amt;
    }
  }

  const netPaid = paid - deductions + adjustments;
  const pending = Math.max(0, salaryAmount - netPaid);

  return { payable: salaryAmount, paid, deductions, adjustments, netPaid, pending };
}

export async function getStaffPeriodBalance(staffId: string, periodMonth: Date) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) return null;

  const payments = await prisma.payment.findMany({
    where: { staffId, periodMonth },
  });

  return computePeriodBalance(decimalToNumber(staff.salaryAmount), payments);
}

export async function nextReceiptNumber(year: number) {
  return prisma.$transaction(async (tx) => {
    const seq = await tx.receiptSequence.upsert({
      where: { year },
      update: { lastNumber: { increment: 1 } },
      create: { year, lastNumber: 1 },
    });
    return `PAY-${year}-${String(seq.lastNumber).padStart(5, "0")}`;
  });
}
