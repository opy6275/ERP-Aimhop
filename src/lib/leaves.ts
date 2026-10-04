import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc } from "@/lib/format";

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

/**
 * Get all leave requests for a specific staff member
 */
export async function getStaffLeaveRequests(staffId: string): Promise<LeaveRecord[]> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT lr.*, s.staff_code as staffCode, s.full_name as staffName, d.name as departmentName
     FROM leave_requests lr
     JOIN staff s ON s.id = lr.staff_id
     LEFT JOIN departments d ON d.id = s.department_id
     WHERE lr.staff_id = ?
     ORDER BY lr.created_at DESC`,
    staffId
  );

  return rows.map(mapLeaveRow);
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
  const id = `leave_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const startIso = toDateOnlyUtc(params.startDate).toISOString();
  const endIso = toDateOnlyUtc(params.endDate).toISOString();

  await prisma.$executeRawUnsafe(
    `INSERT INTO leave_requests (id, staff_id, leave_type, start_date, end_date, days_count, reason, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    id,
    params.staffId,
    params.leaveType,
    startIso,
    endIso,
    params.daysCount,
    params.reason.trim(),
    now,
    now
  );

  const created = await getLeaveRequestById(id);
  if (!created) {
    throw new Error("Failed to create leave request");
  }
  return created;
}

/**
 * Get a single leave request by ID
 */
export async function getLeaveRequestById(id: string): Promise<LeaveRecord | null> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT lr.*, s.staff_code as staffCode, s.full_name as staffName, d.name as departmentName, u.email as reviewerEmail
     FROM leave_requests lr
     JOIN staff s ON s.id = lr.staff_id
     LEFT JOIN departments d ON d.id = s.department_id
     LEFT JOIN users u ON u.id = lr.reviewed_by_id
     WHERE lr.id = ? LIMIT 1`,
    id
  );

  if (!rows || rows.length === 0) return null;
  return mapLeaveRow(rows[0]);
}

/**
 * Query all leave requests with filters for administrator
 */
export async function getAllLeaveRequests(filters?: {
  status?: string;
  departmentId?: string;
  search?: string;
}): Promise<LeaveRecord[]> {
  let query = `
    SELECT lr.*, s.staff_code as staffCode, s.full_name as staffName, d.name as departmentName, u.email as reviewerEmail
    FROM leave_requests lr
    JOIN staff s ON s.id = lr.staff_id
    LEFT JOIN departments d ON d.id = s.department_id
    LEFT JOIN users u ON u.id = lr.reviewed_by_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.status && filters.status !== "all") {
    query += ` AND lr.status = ?`;
    params.push(filters.status);
  }

  if (filters?.departmentId && filters.departmentId !== "all") {
    query += ` AND s.department_id = ?`;
    params.push(filters.departmentId);
  }

  if (filters?.search && filters.search.trim()) {
    const q = `%${filters.search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(s.full_name) LIKE ? OR LOWER(s.staff_code) LIKE ? OR LOWER(lr.reason) LIKE ?)`;
    params.push(q, q, q);
  }

  query += ` ORDER BY lr.created_at DESC`;

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(query, ...params);
  return rows.map(mapLeaveRow);
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

  const reviewedAt = new Date().toISOString();
  const note = params.reviewNote?.trim() || null;

  // 1. Update leave request record
  await prisma.$executeRawUnsafe(
    `UPDATE leave_requests
     SET status = ?, review_note = ?, reviewed_by_id = ?, reviewed_at = ?, updated_at = ?
     WHERE id = ?`,
    params.status,
    note,
    params.reviewerUserId,
    reviewedAt,
    reviewedAt,
    params.leaveId
  );

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
            note: `Approved leave: ${leave.reason.slice(0, 80)}`,
            markedById: params.reviewerUserId,
          },
        });
      }

      cur.setDate(cur.getDate() + 1);
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

  const updated = await getLeaveRequestById(params.leaveId);
  return updated!;
}

function mapLeaveRow(r: Record<string, unknown>): LeaveRecord {
  return {
    id: String(r.id),
    staffId: String(r.staff_id),
    leaveType: String(r.leave_type) as LeaveType,
    startDate: r.start_date instanceof Date ? r.start_date.toISOString() : String(r.start_date),
    endDate: r.end_date instanceof Date ? r.end_date.toISOString() : String(r.end_date),
    daysCount: Number(r.days_count),
    reason: String(r.reason),
    status: String(r.status) as LeaveStatus,
    reviewNote: r.review_note ? String(r.review_note) : null,
    reviewedById: r.reviewed_by_id ? String(r.reviewed_by_id) : null,
    reviewedAt: r.reviewed_at ? (r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : String(r.reviewed_at)) : null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    staffCode: r.staffCode ? String(r.staffCode) : undefined,
    staffName: r.staffName ? String(r.staffName) : undefined,
    departmentName: r.departmentName ? String(r.departmentName) : undefined,
    reviewerEmail: r.reviewerEmail ? String(r.reviewerEmail) : undefined,
  };
}
