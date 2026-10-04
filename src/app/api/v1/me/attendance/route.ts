import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiOk, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc } from "@/lib/format";
import { z } from "zod";

const checkinSchema = z.object({
  status: z.enum(["present", "half_day", "leave"]).default("present"),
  note: z.string().max(200).optional().nullable(),
});

export async function GET(request: Request) {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const month = searchParams.get("month"); // YYYY-MM

  const where: { staffId: string; date?: { gte?: Date; lte?: Date } } = {
    staffId: user.staffId,
  };

  if (month) {
    const [y, m] = month.split("-").map(Number);
    if (y && m) {
      where.date = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0, 23, 59, 59)),
      };
    }
  } else if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [records, staff, company] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: "asc" },
    }),
    prisma.staff.findUnique({
      where: { id: user.staffId },
      include: {
        department: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.company.findFirst(),
  ]);

  const summary = {
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    holiday: 0,
  };
  for (const r of records) {
    if (r.status in summary) {
      summary[r.status as keyof typeof summary] += 1;
    }
  }

  const [y, m] = month ? month.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const totalDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const payableDays = summary.present + summary.half_day * 0.5 + summary.leave;
  const trackedDays = summary.present + summary.absent + summary.half_day + summary.leave + summary.holiday;
  const presenceRate = trackedDays > 0 ? Math.round(((summary.present + summary.half_day * 0.5) / trackedDays) * 100) : 0;

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(Date.UTC(y, m - 1, 1)));

  return apiOk({
    records,
    summary: {
      ...summary,
      totalDays,
      payableDays,
      presenceRate,
    },
    month: month || `${y}-${String(m).padStart(2, "0")}`,
    monthLabel,
    totalDays,
    staff: staff
      ? {
          fullName: staff.fullName,
          staffCode: staff.staffCode,
          department: staff.department.name,
          designation: staff.designation || staff.category.name,
          email: staff.email,
          mobile: staff.mobile,
        }
      : null,
    company: {
      name: company?.name || "AimHop CRM",
      legalName: company?.legalName || company?.name || "AimHop Technologies Pvt Ltd",
      address: company?.address || "Corporate Headquarters, India",
    },
  });
}

export async function POST(request: Request) {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => ({}));
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid check-in details", 400);
  }

  const { status, note } = parsed.data;
  const today = toDateOnlyUtc(new Date());

  const record = await prisma.attendanceRecord.upsert({
    where: { staffId_date: { staffId: user.staffId, date: today } },
    update: {
      status,
      note: note || undefined,
      markedById: user.id,
    },
    create: {
      staffId: user.staffId,
      date: today,
      status,
      note: note || null,
      markedById: user.id,
    },
  });

  await writeAudit({
    actorUserId: user.id,
    action: "attendance.checkin",
    entityType: "attendance",
    entityId: record.id,
    targetLabel: `Self check-in (${status.toUpperCase()}) for ${today.toISOString().slice(0, 10)}`,
  });

  return apiOk({
    record,
    message: `Attendance marked as ${status.toUpperCase()} for today!`,
  });
}
