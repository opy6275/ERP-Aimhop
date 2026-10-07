import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc } from "@/lib/format";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "approve_all", "reject_all"]),
  recordId: z.string().optional(),
  recordIds: z.array(z.string()).optional(),
  date: z.string().optional(),
  finalStatus: z.enum(["present", "absent", "half_day", "leave"]).optional(),
});

export async function GET(request: Request) {
  const user = await requirePermission("attendance.read");
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD or empty / 'all'
  const statusFilter = searchParams.get("status") || "pending"; // 'pending' | 'all' | 'approved' | 'rejected'

  const where: any = {};
  if (statusFilter !== "all") {
    where.approvalStatus = statusFilter;
  }
  if (date && date !== "all") {
    where.date = toDateOnlyUtc(date);
  }

  const [records, totalPendingCount] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        staff: {
          select: {
            id: true,
            staffCode: true,
            fullName: true,
            designation: true,
            email: true,
            mobile: true,
            department: { select: { id: true, name: true } },
          },
        },
        markedBy: {
          select: {
            id: true,
            email: true,
            role: { select: { name: true, slug: true } },
          },
        },
      },
      take: 200,
    }),
    prisma.attendanceRecord.count({
      where: { approvalStatus: "pending" },
    }),
  ]);

  return apiOk({
    records,
    totalPendingCount,
  });
}

export async function POST(request: Request) {
  const user = await requirePermission("attendance.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid approval action payload", 400);
  }

  const { action, recordId, recordIds, date, finalStatus } = parsed.data;

  if (action === "approve") {
    if (!recordId) return apiError("VALIDATION_ERROR", "recordId is required for approve", 400);
    const existing = await prisma.attendanceRecord.findUnique({ where: { id: recordId } });
    if (!existing) return apiError("NOT_FOUND", "Attendance record not found", 404);

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        approvalStatus: "approved",
        markedById: user.id,
        status: finalStatus || existing.status,
      },
      include: { staff: { select: { fullName: true } } },
    });

    await writeAudit({
      actorUserId: user.id,
      action: "attendance.approve",
      entityType: "attendance",
      entityId: updated.id,
      targetLabel: `Approved attendance for ${updated.staff.fullName} as ${updated.status.toUpperCase()}`,
    });

    return apiOk({ record: updated, message: "Attendance approved successfully" });
  }

  if (action === "reject") {
    if (!recordId) return apiError("VALIDATION_ERROR", "recordId is required for reject", 400);
    const existing = await prisma.attendanceRecord.findUnique({ where: { id: recordId } });
    if (!existing) return apiError("NOT_FOUND", "Attendance record not found", 404);

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        approvalStatus: "rejected",
        markedById: user.id,
        status: "absent",
      },
      include: { staff: { select: { fullName: true } } },
    });

    await writeAudit({
      actorUserId: user.id,
      action: "attendance.reject",
      entityType: "attendance",
      entityId: updated.id,
      targetLabel: `Rejected attendance for ${updated.staff.fullName} (marked absent)`,
    });

    return apiOk({ record: updated, message: "Attendance request rejected (marked absent)" });
  }

  if (action === "approve_all") {
    const whereClause: any = { approvalStatus: "pending" };
    if (date && date !== "all") {
      whereClause.date = toDateOnlyUtc(date);
    }
    if (recordIds && recordIds.length > 0) {
      whereClause.id = { in: recordIds };
    }

    const batch = await prisma.attendanceRecord.updateMany({
      where: whereClause,
      data: {
        approvalStatus: "approved",
        markedById: user.id,
      },
    });

    await writeAudit({
      actorUserId: user.id,
      action: "attendance.approve_all",
      entityType: "attendance",
      targetLabel: `Approved all ${batch.count} pending attendance requests`,
    });

    return apiOk({ count: batch.count, message: `Approved ${batch.count} attendance requests` });
  }

  if (action === "reject_all") {
    const whereClause: any = { approvalStatus: "pending" };
    if (date && date !== "all") {
      whereClause.date = toDateOnlyUtc(date);
    }
    if (recordIds && recordIds.length > 0) {
      whereClause.id = { in: recordIds };
    }

    const batch = await prisma.attendanceRecord.updateMany({
      where: whereClause,
      data: {
        approvalStatus: "rejected",
        status: "absent",
        markedById: user.id,
      },
    });

    await writeAudit({
      actorUserId: user.id,
      action: "attendance.reject_all",
      entityType: "attendance",
      targetLabel: `Rejected all ${batch.count} pending attendance requests`,
    });

    return apiOk({ count: batch.count, message: `Rejected ${batch.count} attendance requests` });
  }

  return apiError("BAD_REQUEST", "Unknown action", 400);
}
