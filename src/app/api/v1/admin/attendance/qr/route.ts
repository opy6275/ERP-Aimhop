import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiOk, apiError } from "@/lib/api-response";
import { generateOfficeQrDataUrl } from "@/lib/qr";

export async function GET(request: Request) {
  const user = await requirePermission("attendance.read");
  if (isErrorResponse(user)) return user;

  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = host ? `${proto}://${host}` : undefined;

  try {
    const qrData = await generateOfficeQrDataUrl(baseUrl);
    return apiOk(qrData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate QR code";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
