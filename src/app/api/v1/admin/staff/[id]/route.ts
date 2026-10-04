import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/auth";
import { decimalToNumber } from "@/lib/format";
import { maskAccountNumber } from "@/lib/security";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  fullName: z.string().min(1).max(160).optional(),
  photoUrl: z.string().url().optional().nullable(),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  departmentId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  designation: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  salaryAmount: z.number().min(0).optional(),
  paymentType: z.enum(["monthly", "daily"]).optional(),
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
  return {
    ...staff,
    salaryAmount: canSeeSalary ? decimalToNumber(staff.salaryAmount) : undefined,
    accountNumber: canSeeSalary
      ? staff.accountNumber
      : maskAccountNumber(staff.accountNumber),
    bankName: canSeeSalary ? staff.bankName : staff.bankName ? "••••" : null,
    ifsc: canSeeSalary ? staff.ifsc : staff.ifsc ? "••••" : null,
    upiId: canSeeSalary ? staff.upiId : staff.upiId ? "••••" : null,
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requirePermission("staff.read");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
    },
  });
  if (!staff) return notFound();

  const canSeeSalary = hasPermission(user, "staff.salary.read");
  return apiOk({ staff: serializeStaff(staff, canSeeSalary) });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requirePermission("staff.update");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid update payload", 400, {
      detail: parsed.error.issues[0]?.message,
    });
  }

  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) return notFound();

  const d = parsed.data;

  // Check salary permission if modifying salary
  if (d.salaryAmount !== undefined && !hasPermission(user, "staff.salary.update")) {
    return apiError("FORBIDDEN", "No permission to update salary amount", 403);
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      ...(d.fullName ? { fullName: d.fullName } : {}),
      ...(d.photoUrl !== undefined ? { photoUrl: d.photoUrl } : {}),
      ...(d.gender !== undefined ? { gender: d.gender } : {}),
      ...(d.dateOfBirth !== undefined ? { dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null } : {}),
      ...(d.mobile !== undefined ? { mobile: d.mobile } : {}),
      ...(d.email !== undefined ? { email: d.email } : {}),
      ...(d.address !== undefined ? { address: d.address } : {}),
      ...(d.departmentId ? { departmentId: d.departmentId } : {}),
      ...(d.categoryId ? { categoryId: d.categoryId } : {}),
      ...(d.designation !== undefined ? { designation: d.designation } : {}),
      ...(d.joiningDate !== undefined ? { joiningDate: d.joiningDate ? new Date(d.joiningDate) : null } : {}),
      ...(d.employmentType !== undefined ? { employmentType: d.employmentType } : {}),
      ...(d.status ? { status: d.status } : {}),
      ...(d.salaryAmount !== undefined ? { salaryAmount: d.salaryAmount } : {}),
      ...(d.paymentType ? { paymentType: d.paymentType } : {}),
      ...(d.bankName !== undefined ? { bankName: d.bankName } : {}),
      ...(d.accountNumber !== undefined ? { accountNumber: d.accountNumber } : {}),
      ...(d.ifsc !== undefined ? { ifsc: d.ifsc } : {}),
      ...(d.upiId !== undefined ? { upiId: d.upiId } : {}),
    },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
    },
  });

  await writeAudit({
    actorUserId: user.id,
    action: "staff.update",
    entityType: "staff",
    entityId: updated.id,
    targetLabel: `${updated.staffCode} ${updated.fullName}`,
    changes: d,
  });

  return apiOk({
    staff: serializeStaff(updated, hasPermission(user, "staff.salary.read")),
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requirePermission("staff.delete");
  if (isErrorResponse(user)) return user;
  const { id } = await ctx.params;

  const existing = await prisma.staff.findUnique({
    where: { id },
    include: {
      user: true,
      _count: {
        select: { payments: true, attendance: true },
      },
    },
  });
  if (!existing) return notFound();

  // Atomically delete linked user credentials and staff profile
  await prisma.$transaction([
    prisma.user.deleteMany({ where: { staffId: id } }),
    prisma.staff.delete({ where: { id } }),
  ]);

  await writeAudit({
    actorUserId: user.id,
    action: "staff.delete",
    entityType: "staff",
    entityId: id,
    targetLabel: `${existing.staffCode} ${existing.fullName}`,
  });

  return apiOk({ success: true, message: "Staff member and linked credentials deleted successfully" });
}
