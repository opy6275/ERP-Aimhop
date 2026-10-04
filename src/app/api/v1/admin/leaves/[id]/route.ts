import { z } from "zod";
import { isErrorResponse, requireAdmin } from "@/lib/rbac";
import { apiOk, apiError } from "@/lib/api-response";
import { reviewLeaveRequest, getLeaveRequestById } from "@/lib/leaves";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(500).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  const { id } = await params;
  const leave = await getLeaveRequestById(id);
  if (!leave) {
    return apiError("NOT_FOUND", "Leave request not found", 404);
  }
  return apiOk({ leave });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid review payload", 400);
  }

  try {
    const updated = await reviewLeaveRequest({
      leaveId: id,
      reviewerUserId: user.id,
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
    });

    return apiOk({ leave: updated, message: `Leave request ${parsed.data.status} successfully` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review leave request";
    return apiError("BAD_REQUEST", message, 400);
  }
}
