import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export async function nextStaffCode() {
  const rows = await prisma.$queryRaw<{ staff_code: string }[]>`
    SELECT staff_code
    FROM staff
    WHERE staff_code ~ '^STAFF-[0-9]+$'
    ORDER BY length(staff_code) DESC, staff_code DESC
    LIMIT 1
  `;
  let n = 1;
  if (rows && rows.length > 0 && rows[0].staff_code) {
    const m = /^STAFF-(\d+)$/.exec(rows[0].staff_code);
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
  payableDays?: number;
};

export function computePeriodBalance(
  salaryAmount: number,
  payments: { amount: unknown; paymentKind: string }[],
  options?: {
    paymentType?: "monthly" | "daily" | string;
    payableDays?: number;
    totalDaysInMonth?: number;
  },
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

  let payable = salaryAmount;
  if (options?.paymentType === "daily" && typeof options.payableDays === "number") {
    payable = Math.round(salaryAmount * options.payableDays);
  } else if (
    options?.paymentType === "monthly" &&
    typeof options.payableDays === "number" &&
    typeof options.totalDaysInMonth === "number" &&
    options.totalDaysInMonth > 0
  ) {
    // Pro-rata based on attended days, approved leaves, and holidays
    payable = Math.round((salaryAmount / options.totalDaysInMonth) * options.payableDays);
  }

  const netPaid = paid - deductions + adjustments;
  const pending = Math.max(0, payable - netPaid);

  return { payable, paid, deductions, adjustments, netPaid, pending, payableDays: options?.payableDays };
}

export async function getStaffPeriodBalance(staffId: string, periodMonth: Date) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) return null;

  const y = periodMonth.getUTCFullYear();
  const m = periodMonth.getUTCMonth();
  const startDate = new Date(Date.UTC(y, m, 1));
  const endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  const totalDaysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

  const [payments, records, holidays] = await Promise.all([
    prisma.payment.findMany({ where: { staffId, periodMonth } }),
    prisma.attendanceRecord.findMany({
      where: {
        staffId,
        date: { gte: startDate, lte: endDate },
        approvalStatus: "approved",
      },
    }),
    prisma.companyHoliday.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    }),
  ]);

  let present = 0;
  let halfDay = 0;
  let leave = 0;
  const recordedDays = new Set<number>();

  for (const r of records) {
    const day = new Date(r.date).getUTCDate();
    recordedDays.add(day);
    if (r.status === "present") present += 1;
    else if (r.status === "half_day") halfDay += 1;
    else if (r.status === "leave") leave += 1;
  }

  let holidayCount = 0;
  for (const h of holidays) {
    const day = new Date(h.date).getUTCDate();
    if (!recordedDays.has(day)) holidayCount += 1;
  }

  const attendedDays = present + halfDay * 0.5;
  const payableDays = attendedDays + leave + holidayCount;

  return computePeriodBalance(
    decimalToNumber(staff.salaryAmount),
    payments,
    {
      paymentType: staff.paymentType,
      payableDays,
      totalDaysInMonth,
    },
  );
}

export async function nextReceiptNumber(year: number) {
  const seq = await prisma.receiptSequence.upsert({
    where: { year },
    update: { lastNumber: { increment: 1 } },
    create: { year, lastNumber: 1 },
  });
  return `PAY-${year}-${String(seq.lastNumber).padStart(5, "0")}`;
}
