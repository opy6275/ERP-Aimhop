import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { decimalToNumber, parsePeriodMonth } from "@/lib/format";

const createSchema = z.object({
  staffId: z.string().min(1),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/),
  paymentDate: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(["cash", "bank_transfer", "upi", "other"]),
  paymentKind: z.enum(["salary", "partial", "advance", "deduction", "adjustment"]),
  note: z.string().optional().nullable(),
  generateReceipt: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
  recipientEmail: z.string().email().optional().or(z.literal("")),
});

export async function GET(request: Request) {
  const user = await requirePermission("payments.read");
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId") ?? undefined;
  const period = searchParams.get("period");
  const periodMonth = period ? parsePeriodMonth(period) : null;

  const payments = await prisma.payment.findMany({
    where: {
      ...(staffId ? { staffId } : {}),
      ...(periodMonth ? { periodMonth } : {}),
    },
    orderBy: { paymentDate: "desc" },
    take: 200,
    include: {
      staff: {
        select: {
          id: true,
          staffCode: true,
          fullName: true,
          department: { select: { name: true } },
        },
      },
      receipt: { select: { id: true, receiptNumber: true } },
    },
  });

  return apiOk({
    payments: payments.map((p) => ({
      ...p,
      amount: decimalToNumber(p.amount),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requirePermission("payments.create");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid payment data", 400);

  const d = parsed.data;
  const periodMonth = parsePeriodMonth(d.periodMonth);
  if (!periodMonth) return apiError("VALIDATION_ERROR", "Invalid period month", 400);

  const staff = await prisma.staff.findUnique({
    where: { id: d.staffId },
    include: { department: true },
  });
  if (!staff) return apiError("NOT_FOUND", "Staff not found", 404);

  const payment = await prisma.payment.create({
    data: {
      staffId: d.staffId,
      periodMonth,
      paymentDate: new Date(d.paymentDate),
      amount: d.amount,
      paymentMethod: d.paymentMethod,
      paymentKind: d.paymentKind,
      note: d.note || null,
      createdById: user.id,
    },
  });

  let receipt = null;
  if (d.generateReceipt) {
    const canReceipt = user.permissions.includes("receipts.generate");
    if (canReceipt) {
      const year = periodMonth.getUTCFullYear();
      const { nextReceiptNumber } = await import("@/lib/domain");
      const company = await prisma.company.findFirst();
      const receiptNumber = await nextReceiptNumber(year);
      receipt = await prisma.paymentReceipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          companyName: company?.name ?? "Company",
          employeeName: staff.fullName,
          staffCode: staff.staffCode,
          departmentName: staff.department.name,
          periodLabel: d.periodMonth,
          amountPaid: d.amount,
          paymentMethod: d.paymentMethod,
          authorizedBy: user.email,
          issuedById: user.id,
        },
      });
    }
  }

  let emailResult = null;
  if (d.sendEmail) {
    const { sendSalarySlipEmail } = await import("@/lib/email");
    emailResult = await sendSalarySlipEmail({
      paymentId: payment.id,
      recipientOverride: d.recipientEmail || undefined,
      actorUserId: user.id,
    });
  }

  await writeAudit({
    actorUserId: user.id,
    action: "payment.create",
    entityType: "payment",
    entityId: payment.id,
    targetLabel: `${staff.staffCode} ${d.amount}`,
  });

  return apiOk(
    {
      payment: { ...payment, amount: decimalToNumber(payment.amount) },
      receipt,
      emailResult,
    },
    201,
  );
}
