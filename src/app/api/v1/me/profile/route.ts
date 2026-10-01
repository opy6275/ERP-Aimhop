import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireStaffSelf();
  if (isErrorResponse(user)) return user;

  const staff = await prisma.staff.findUnique({
    where: { id: user.staffId },
    include: {
      department: { select: { id: true, name: true, code: true } },
      category: { select: { id: true, name: true } },
    },
  });
  if (!staff) return notFound();

  return apiOk({
    id: staff.id,
    staffCode: staff.staffCode,
    fullName: staff.fullName,
    photoUrl: staff.photoUrl,
    gender: staff.gender,
    dateOfBirth: staff.dateOfBirth,
    mobile: staff.mobile,
    email: staff.email,
    address: staff.address,
    designation: staff.designation,
    joiningDate: staff.joiningDate,
    employmentType: staff.employmentType,
    status: staff.status,
    department: staff.department,
    category: staff.category,
  });
}
