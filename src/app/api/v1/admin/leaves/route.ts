import { isErrorResponse, requireAdmin } from "@/lib/rbac";
import { apiOk, apiError } from "@/lib/api-response";
import { getAllLeaveRequests } from "@/lib/leaves";

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const departmentId = searchParams.get("departmentId") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const leaves = await getAllLeaveRequests({ status, departmentId, search });
    return apiOk({ leaves });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch leave requests";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
