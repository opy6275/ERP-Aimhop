import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc } from "@/lib/format";

const upsertSchema = z.object({
  date: z.string().min(1),
  records: z
    .array(
      z.object({
        staffId: z.string().min(1),
        status: z.enum(["present", "absent", "leave", "half_day", "holiday"]),
        note: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

export async function GET(request: Request) {
  const user = await requirePermission("attendance.read");
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const staffId = searchParams.get("staffId") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const records = await prisma.attendanceRecord.findMany({
    where: {
      ...(staffId ? { staffId } : {}),
      ...(date
        ? { date: toDateOnlyUtc(date) }
        : from || to
          ? {
              date: {
                ...(from ? { gte: toDateOnlyUtc(from) } : {}),
                ...(to ? { lte: toDateOnlyUtc(to) } : {}),
              },
            }
          : {}),
      ...(departmentId ? { staff: { departmentId } } : {}),
    },
    orderBy: [{ date: "desc" }, { staff: { fullName: "asc" } }],
    include: {
      staff: {
        select: {
          id: true,
          staffCode: true,
          fullName: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
    take: 500,
  });

  return apiOk({ records });
}

export async function PUT(request: Request) {
  const user = await requirePermission("attendance.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid attendance payload", 400);

  const day = toDateOnlyUtc(parsed.data.date);
  const results = [];

  for (const r of parsed.data.records) {
    const row = await prisma.attendanceRecord.upsert({
      where: { staffId_date: { staffId: r.staffId, date: day } },
      update: { status: r.status, approvalStatus: "approved", note: r.note || null, markedById: user.id },
      create: {
        staffId: r.staffId,
        date: day,
        status: r.status,
        approvalStatus: "approved",
        note: r.note || null,
        markedById: user.id,
      },
    });
    results.push(row);
  }

  await writeAudit({
    actorUserId: user.id,
    action: "attendance.mark",
    entityType: "attendance",
    targetLabel: `Marked ${results.length} for ${parsed.data.date}`,
  });

  return apiOk({ records: results });
}
