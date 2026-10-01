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

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: "desc" },
  });

  const summary = {
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    holiday: 0,
  };
  for (const r of records) {
    summary[r.status] += 1;
  }

  return apiOk({ records, summary });
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
