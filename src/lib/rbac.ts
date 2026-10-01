import { NextResponse } from "next/server";
import { getAuthUser, hasPermission, type AuthUser } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) return apiError("UNAUTHORIZED", "Sign in required", 401);
  return user;
}

export async function requirePermission(
  key: string | string[],
): Promise<AuthUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;

  const keys = Array.isArray(key) ? key : [key];
  const ok = keys.some((k) => hasPermission(user, k));
  if (!ok) return apiError("FORBIDDEN", "You do not have permission for this action", 403);
  return user;
}

export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (user.role.slug === "staff") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }
  return user;
}

/** Staff self-scope: must be staff role with linked staffId */
export async function requireStaffSelf(): Promise<
  (AuthUser & { staffId: string }) | NextResponse
> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (!user.staffId) {
    return apiError("FORBIDDEN", "No staff profile linked to this account", 403);
  }
  return user as AuthUser & { staffId: string };
}

export function isErrorResponse(value: AuthUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
