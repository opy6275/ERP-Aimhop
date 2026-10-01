import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { nextStaffCode } from "@/lib/domain";
import { decimalToNumber } from "@/lib/format";
import { hasPermission } from "@/lib/auth";
import { maskAccountNumber } from "@/lib/security";

const createSchema = z.object({
  fullName: z.string().min(1).max(160),
  photoUrl: z.string().url().optional().nullable(),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  departmentId: z.string().min(1),
  categoryId: z.string().min(1),
  designation: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  salaryAmount: z.number().min(0).default(0),
  paymentType: z.enum(["monthly", "daily"]).default("monthly"),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifsc: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
});

function serializeStaff(
  staff: {
    salaryAmount: { toString(): string };
    accountNumber: string | null;
    [k: string]: unknown;
  },
  canSeeSalary: boolean,
) {
  const base = {
    ...staff,
    salaryAmount: canSeeSalary ? decimalToNumber(staff.salaryAmount) : undefined,
    accountNumber: canSeeSalary
      ? staff.accountNumber
      : maskAccountNumber(staff.accountNumber),
    bankName: canSeeSalary ? staff.bankName : staff.bankName ? "••••" : null,
    ifsc: canSeeSalary ? staff.ifsc : staff.ifsc ? "••••" : null,
    upiId: canSeeSalary ? staff.upiId : staff.upiId ? "••••" : null,
  };
  return base;
}

export async function GET(request: Request) {
  const user = await requirePermission("staff.read");
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const status = searchParams.get("status") as "active" | "inactive" | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const where = {
    ...(departmentId ? { departmentId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { staffCode: { contains: q } },
            { email: { contains: q } },
            { mobile: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    }),
  ]);

  const canSeeSalary = hasPermission(user, "staff.salary.read");

  return apiOk({
    page,
    limit,
    total,
    staff: rows.map((s) => serializeStaff(s, canSeeSalary)),
  });
}

export async function POST(request: Request) {
  const user = await requirePermission("staff.create");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid staff data", 400, {
      detail: parsed.error.issues[0]?.message ?? "invalid",
    });
  }

  const d = parsed.data;
  if (!hasPermission(user, "staff.salary.update") && d.salaryAmount > 0) {
    return apiError("FORBIDDEN", "No permission to set salary", 403);
  }

  const staffCode = await nextStaffCode();
  const staff = await prisma.staff.create({
    data: {
      staffCode,
      fullName: d.fullName,
      photoUrl: d.photoUrl || null,
      gender: d.gender || null,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
      mobile: d.mobile || null,
      email: d.email || null,
      address: d.address || null,
      departmentId: d.departmentId,
      categoryId: d.categoryId,
      designation: d.designation || null,
      joiningDate: d.joiningDate ? new Date(d.joiningDate) : null,
      employmentType: d.employmentType || null,
      status: d.status,
      salaryAmount: d.salaryAmount,
      paymentType: d.paymentType,
      bankName: d.bankName || null,
      accountNumber: d.accountNumber || null,
      ifsc: d.ifsc || null,
      upiId: d.upiId || null,
    },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  await writeAudit({
    actorUserId: user.id,
    action: "staff.create",
    entityType: "staff",
    entityId: staff.id,
    targetLabel: `${staff.staffCode} ${staff.fullName}`,
  });

  return apiOk(
    { staff: serializeStaff(staff, hasPermission(user, "staff.salary.read")) },
    201,
  );
}
