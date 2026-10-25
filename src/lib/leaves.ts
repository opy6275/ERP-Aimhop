import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc, decimalToNumber } from "@/lib/format";

export type LeaveType = "casual" | "sick" | "paid" | "unpaid" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveBalanceData {
  year: number;
  clTotal: number;
  clUsed: number;
  clRemaining: number;
  slTotal: number;
  slUsed: number;
  slRemaining: number;
  plTotal: number;
  plUsed: number;
  plRemaining: number;
}

export async function getOrCreateStaffLeaveBalance(staffId: string, year?: number): Promise<LeaveBalanceData> {
  const currentYear = year || new Date().getFullYear();
  let row;
  try {
    row = await prisma.leaveBalance.upsert({
      where: { staffId_year: { staffId, year: currentYear } },
      update: {},
      create: {
        staffId,
        year: currentYear,
        clTotal: 12,
        clUsed: 0,
        slTotal: 8,
        slUsed: 0,
        plTotal: 15,
        plUsed: 0,
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002") {
      row = await prisma.leaveBalance.findUnique({
        where: { staffId_year: { staffId, year: currentYear } },
      });
    } else {
      throw err;
    }
  }

  if (!row) {
    throw new Error(`Failed to initialize leave balance for staff ID ${staffId}`);
  }

  const clTotal = decimalToNumber(row.clTotal);
  const clUsed = decimalToNumber(row.clUsed);
  const slTotal = decimalToNumber(row.slTotal);
  const slUsed = decimalToNumber(row.slUsed);
  const plTotal = decimalToNumber(row.plTotal);
  const plUsed = decimalToNumber(row.plUsed);

  return {
    year: currentYear,
    clTotal,
    clUsed,
    clRemaining: Math.max(0, clTotal - clUsed),
    slTotal,
    slUsed,
    slRemaining: Math.max(0, slTotal - slUsed),
    plTotal,
    plUsed,
    plRemaining: Math.max(0, plTotal - plUsed),
  };
}

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

  // Calculate calendar days to prevent negative or arbitrary invalid values
  const msDiff = e.getTime() - s.getTime();
  const calendarDays = Math.round(msDiff / (1000 * 60 * 60 * 24)) + 1;
  const effectiveDaysCount = params.daysCount > 0 && params.daysCount <= calendarDays ? params.daysCount : calendarDays;

  const created = await prisma.leaveRequest.create({
    data: {
      staffId: params.staffId,
      leaveType: params.leaveType,
      startDate: s,
      endDate: e,
      daysCount: effectiveDaysCount,
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

  const { createNotification } = await import("@/lib/notifications");
  await createNotification({
    title: "New Leave Application",
    message: `${created.staff?.fullName || "Staff"} applied for ${params.daysCount} day(s) ${params.leaveType} leave.`,
    type: "leave",
    linkUrl: "/admin/leaves",
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
      { reason: { contains: q, mode: "insensitive" } },
      { staff: { fullName: { contains: q, mode: "insensitive" } } },
      { staff: { staffCode: { contains: q, mode: "insensitive" } } },
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

  // Execute review, attendance upsert, and quota update in an atomic transaction
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update leave request record
    const up = await tx.leaveRequest.update({
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

        await tx.attendanceRecord.upsert({
          where: { staffId_date: { staffId: leave.staffId, date: dayDate } },
          update: {
            status: "leave",
            approvalStatus: "approved",
            note: `Approved leave: ${leave.reason.slice(0, 80)}`,
            markedById: params.reviewerUserId,
          },
          create: {
            staffId: leave.staffId,
            date: dayDate,
            status: "leave",
            approvalStatus: "approved",
            note: `Approved leave: ${leave.reason.slice(0, 80)}`,
            markedById: params.reviewerUserId,
          },
        });

        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      // 2.1 Deduct leave quota atomically using database increment
      const leaveYear = new Date(leave.startDate).getFullYear();
      const days = Number(leave.daysCount);

      await tx.leaveBalance.upsert({
        where: { staffId_year: { staffId: leave.staffId, year: leaveYear } },
        create: {
          staffId: leave.staffId,
          year: leaveYear,
          clTotal: 12,
          clUsed: leave.leaveType === "casual" ? days : 0,
          slTotal: 8,
          slUsed: leave.leaveType === "sick" ? days : 0,
          plTotal: 15,
          plUsed: leave.leaveType === "paid" ? days : 0,
        },
        update: {
          ...(leave.leaveType === "casual" ? { clUsed: { increment: days } } : {}),
          ...(leave.leaveType === "sick" ? { slUsed: { increment: days } } : {}),
          ...(leave.leaveType === "paid" ? { plUsed: { increment: days } } : {}),
        },
      });
    }

    return up;
  }, {
    maxWait: 15000,
    timeout: 25000,
  });

  // 3. Notify the employee user about decision
  try {
    const staffUser = await prisma.user.findFirst({ where: { staffId: leave.staffId } });
    if (staffUser) {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        userId: staffUser.id,
        title: `Leave Application ${params.status.toUpperCase()}`,
        message: `Your ${leave.leaveType} leave application (${leave.daysCount} days) has been ${params.status}.`,
        type: "leave",
        linkUrl: "/app/leaves",
      });
    }
  } catch (notifErr) {
    console.error("Failed to notify employee:", notifErr);
  }

  // 4. Write append-only audit trail
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
