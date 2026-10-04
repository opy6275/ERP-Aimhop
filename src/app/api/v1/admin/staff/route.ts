import bcrypt from "bcryptjs";
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
  // Portal login credentials
  createLogin: z.boolean().default(false),
  portalEmail: z.string().email().optional().nullable(),
  portalPassword: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
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

  const loginEmail = (d.portalEmail || d.email)?.trim().toLowerCase();
  const shouldCreateLogin = d.createLogin || Boolean(d.portalPassword);

  if (shouldCreateLogin) {
    if (!loginEmail) {
      return apiError("VALIDATION_ERROR", "Login Email is required to create portal credentials.", 400);
    }
    if (!d.portalPassword || d.portalPassword.length < 6) {
      return apiError("VALIDATION_ERROR", "Password must be at least 6 characters.", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
    if (existingUser) {
      return apiError("CONFLICT", `A user account with email "${loginEmail}" already exists.`, 400);
    }
  }

  const staffRole = shouldCreateLogin
    ? await prisma.role.findUnique({ where: { slug: "staff" } })
    : null;

  if (shouldCreateLogin && !staffRole) {
    return apiError("INTERNAL_ERROR", "Staff system role not found. Please contact administrator.", 500);
  }

  const staffCode = await nextStaffCode();
  const passwordHash = shouldCreateLogin && d.portalPassword
    ? await bcrypt.hash(d.portalPassword, 10)
    : null;

  // Execute in transaction for atomicity
  const { staff, userAccount } = await prisma.$transaction(async (tx) => {
    const s = await tx.staff.create({
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
        user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
      },
    });

    let u = null;
    if (shouldCreateLogin && loginEmail && passwordHash && staffRole) {
      u = await tx.user.create({
        data: {
          email: loginEmail,
          passwordHash,
          roleId: staffRole.id,
          staffId: s.id,
          isActive: d.status === "active",
        },
        select: { id: true, email: true, isActive: true },
      });
    }

    return { staff: s, userAccount: u };
  });

  await writeAudit({
    actorUserId: user.id,
    action: "staff.create",
    entityType: "staff",
    entityId: staff.id,
    targetLabel: `${staff.staffCode} ${staff.fullName}`,
  });

  if (userAccount) {
    await writeAudit({
      actorUserId: user.id,
      action: "user.create",
      entityType: "user",
      entityId: userAccount.id,
      targetLabel: userAccount.email,
    });
  }

  return apiOk(
    {
      staff: serializeStaff(staff, hasPermission(user, "staff.salary.read")),
      loginCreated: Boolean(userAccount),
      loginEmail: userAccount?.email ?? null,
    },
    201,
  );
}
