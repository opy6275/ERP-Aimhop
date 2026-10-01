import { getAuthUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("UNAUTHORIZED", "Sign in required", 401);

  const staff = user.staffId
    ? await prisma.staff.findUnique({
        where: { id: user.staffId },
        select: {
          id: true,
          staffCode: true,
          fullName: true,
          photoUrl: true,
          department: { select: { id: true, name: true } },
          designation: true,
        },
      })
    : null;

  return apiOk({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    staffId: user.staffId,
    staff,
  });
}
