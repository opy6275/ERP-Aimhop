import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc, decimalToNumber } from "@/lib/format";

export type LeaveType = "casual" | "sick" | "paid" | "unpaid" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRecord {
  id: string;
  staffId: string;
  leaveType: LeaveType;
  startDate: string; // ISO date
  endDate: string; // ISO date
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  staffCode?: string;
  staffName?: string;
  departmentName?: string;
  reviewerEmail?: string;
}

type LeaveWithRelations = {
  id: string;
  staffId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  daysCount: unknown;
  reason: string;
  status: string;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  staff?: {
    staffCode: string;
    fullName: string;
    department?: { name: string } | null;
  } | null;
  reviewedBy?: { email: string } | null;
};

function formatLeaveRecord(r: LeaveWithRelations): LeaveRecord {
  return {
    id: r.id,
    staffId: r.staffId,
    leaveType: r.leaveType as LeaveType,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    daysCount: decimalToNumber(r.daysCount as { toString(): string } | number),
    reason: r.reason,
    status: r.status as LeaveStatus,
    reviewNote: r.reviewNote,
    reviewedById: r.reviewedById,
    reviewedAt: r.reviewedAt?.toISOString() || null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    staffCode: r.staff?.staffCode,
    staffName: r.staff?.fullName,
    departmentName: r.staff?.department?.name,
    reviewerEmail: r.reviewedBy?.email,
  };
}

/**
 * Get all leave requests for a specific staff member
 */
export async function getStaffLeaveRequests(staffId: string): Promise<LeaveRecord[]> {
  const rows = await prisma.leaveRequest.findMany({
    where: { staffId },
    include: {
      staff: {
        select: {
          staffCode: true,
          fullName: true,
          department: { select: { name: true } },
        },
      },
      reviewedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(formatLeaveRecord);
}

/**
 * Submit a new leave request for a staff member
 */
export async function createLeaveRequest(params: {
  staffId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysCount: number;
  reason: string;
}): Promise<LeaveRecord> {
  const s = toDateOnlyUtc(params.startDate);
  const e = toDateOnlyUtc(params.endDate);

  if (s > e) {
    throw new Error("Leave start date cannot be after end date.");
  }

  // Prevent overlapping pending or approved leave requests for the same staff member
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      staffId: params.staffId,
      status: { in: ["pending", "approved"] },
      startDate: { lte: e },
      endDate: { gte: s },
    },
  });

  if (overlapping) {
    throw new Error(
      `You already have an active leave request (${overlapping.status}) overlapping with these dates.`,
    );
  }

  const created = await prisma.leaveRequest.create({
    data: {
      staffId: params.staffId,
      leaveType: params.leaveType,
      startDate: s,
      endDate: e,
      daysCount: params.daysCount,
      reason: params.reason.trim(),
      status: "pending",
    },
    include: {
      staff: {
        select: {
          staffCode: true,
          fullName: true,
          department: { select: { name: true } },
        },
      },
      reviewedBy: { select: { email: true } },
    },
  });

  return formatLeaveRecord(created);
}

/**
 * Get a single leave request by ID
 */
export async function getLeaveRequestById(id: string): Promise<LeaveRecord | null> {
  const row = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          staffCode: true,
          fullName: true,
          department: { select: { name: true } },
        },
      },
      reviewedBy: { select: { email: true } },
    },
  });

  if (!row) return null;
  return formatLeaveRecord(row);
}

/**
 * Query all leave requests with filters for administrator
 */
export async function getAllLeaveRequests(filters?: {
  status?: string;
  departmentId?: string;
  search?: string;
}): Promise<LeaveRecord[]> {
  const where: Record<string, unknown> = {};

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.departmentId && filters.departmentId !== "all") {
    where.staff = { departmentId: filters.departmentId };
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { reason: { contains: q } },
      { staff: { fullName: { contains: q } } },
      { staff: { staffCode: { contains: q } } },
    ];
  }

  const rows = await prisma.leaveRequest.findMany({
    where,
    include: {
      staff: {
        select: {
          staffCode: true,
          fullName: true,
          department: { select: { name: true } },
        },
      },
      reviewedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(formatLeaveRecord);
}

/**
 * Review leave request (Approve / Reject)
 * When approved, automatically marks AttendanceRecord for all days in date range as "leave".
 */
export async function reviewLeaveRequest(params: {
  leaveId: string;
  reviewerUserId: string;
  status: "approved" | "rejected";
  reviewNote?: string;
}): Promise<LeaveRecord> {
  const leave = await getLeaveRequestById(params.leaveId);
  if (!leave) {
    throw new Error("Leave request not found");
  }

  if (leave.status !== "pending") {
    throw new Error(`Cannot review leave request that is already ${leave.status}`);
  }

  const note = params.reviewNote?.trim() || null;

  // 1. Update leave request record
  const updated = await prisma.leaveRequest.update({
    where: { id: params.leaveId },
    data: {
      status: params.status,
      reviewNote: note,
      reviewedById: params.reviewerUserId,
      reviewedAt: new Date(),
    },
    include: {
      staff: {
        select: {
          staffCode: true,
          fullName: true,
          department: { select: { name: true } },
        },
      },
      reviewedBy: { select: { email: true } },
    },
  });

  // 2. If approved, automatically sync attendance records for the entire range
  if (params.status === "approved") {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dayDate = toDateOnlyUtc(cur);

      // Upsert attendance record for this day
      const existing = await prisma.attendanceRecord.findUnique({
        where: { staffId_date: { staffId: leave.staffId, date: dayDate } },
      });

      if (existing) {
        await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status: "leave",
            approvalStatus: "approved",
            note: `Approved leave: ${leave.reason.slice(0, 80)}`,
            markedById: params.reviewerUserId,
          },
        });
      } else {
        await prisma.attendanceRecord.create({
          data: {
            staffId: leave.staffId,
            date: dayDate,
            status: "leave",
            approvalStatus: "approved",
            note: `Approved leave: ${leave.reason.slice(0, 80)}`,
            markedById: params.reviewerUserId,
          },
        });
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // 3. Write append-only audit trail
  await writeAudit({
    actorUserId: params.reviewerUserId,
    action: `leave.${params.status}`,
    entityType: "leave_request",
    entityId: params.leaveId,
    targetLabel: `${leave.staffName} (${leave.staffCode}) - ${params.status.toUpperCase()}`,
    changes: {
      status: params.status,
      reviewNote: note,
      leaveType: leave.leaveType,
      daysCount: leave.daysCount,
    },
  });

  return formatLeaveRecord(updated);
}
