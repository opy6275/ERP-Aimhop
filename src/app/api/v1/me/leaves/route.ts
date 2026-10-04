import { z } from "zod";
import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { getStaffLeaveRequests, createLeaveRequest, LeaveType } from "@/lib/leaves";

const applyLeaveSchema = z.object({
  leaveType: z.enum(["casual", "sick", "paid", "unpaid", "other"]).default("casual"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(500),
});

export async function GET() {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const leaves = await getStaffLeaveRequests(user.staffId);
  return apiOk({ leaves });
}

export async function POST(request: Request) {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const json = await request.json().catch(() => null);
  const parsed = applyLeaveSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid leave application data", 400);
  }

  const { leaveType, startDate, endDate, reason } = parsed.data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return apiError("VALIDATION_ERROR", "Invalid start or end date format", 400);
  }

  if (end < start) {
    return apiError("VALIDATION_ERROR", "End date cannot be earlier than start date", 400);
  }

  // Calculate day count
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  try {
    const leave = await createLeaveRequest({
      staffId: user.staffId,
      leaveType: leaveType as LeaveType,
      startDate: start,
      endDate: end,
      daysCount: diffDays,
      reason,
    });

    return apiOk({ leave, message: "Leave application submitted successfully" }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit leave request";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
