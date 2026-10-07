import { AppShell } from "@/components/layout/app-shell";
import {
  AdminUsersManager,
  type UserAccessItem,
  type RoleOption,
} from "@/components/admin/admin-users-manager";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  const [staffMembers, rootAdmins, roles] = await Promise.all([
    prisma.staff.findMany({
      orderBy: { staffCode: "asc" },
      include: {
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        user: {
          include: { role: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { staffId: null },
      include: { role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  // Unified items list containing all administrators and all company staff members
  const items: UserAccessItem[] = [
    // 1. Root / Standalone Admins
    ...rootAdmins.map((u) => ({
      id: `admin-${u.id}`,
      isMasterAdmin: true,
      staffId: null,
      staffCode: null,
      fullName: u.email.includes("superadmin")
        ? "Master Administrator"
        : "System Administrator",
      departmentName: "ERP Administration",
      designation: u.role.name || "Administrator",
      contactEmail: u.email,
      mobile: null,
      hasUser: true,
      userId: u.id,
      loginEmail: u.email,
      roleName: u.role.name,
      roleSlug: u.role.slug,
      userIsActive: u.isActive,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    })),

    // 2. All Company Staff Members
    ...staffMembers.map((s) => ({
      id: `staff-${s.id}`,
      isMasterAdmin: false,
      staffId: s.id,
      staffCode: s.staffCode,
      fullName: s.fullName,
      departmentName: s.department?.name || "General",
      designation: s.designation || s.category?.name || "Staff Member",
      contactEmail: s.email,
      mobile: s.mobile,
      hasUser: Boolean(s.user),
      userId: s.user?.id || null,
      loginEmail: s.user?.email || null,
      roleName: s.user?.role?.name || "Staff",
      roleSlug: s.user?.role?.slug || "staff",
      userIsActive: s.user ? s.user.isActive : false,
      lastLoginAt: s.user?.lastLoginAt ? s.user.lastLoginAt.toISOString() : null,
      createdAt: s.user ? s.user.createdAt.toISOString() : null,
    })),
  ];

  const totalMembers = items.length;
  const activeLogins = items.filter((i) => i.hasUser && i.userIsActive).length;
  const pendingLogins = items.filter((i) => !i.hasUser).length;
  const adminUsers = items.filter(
    (i) => i.hasUser && (i.roleSlug === "admin" || i.roleSlug === "super_admin"),
  ).length;

  const roleOptions: RoleOption[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
  }));

  return (
    <AppShell
      title="User Management & Staff Access"
      email={session.email}
      roleLabel={roleLabel}
      variant="admin"
    >
      <AdminUsersManager
        items={items}
        roles={roleOptions}
        metrics={{
          totalMembers,
          activeLogins,
          pendingLogins,
          adminUsers,
        }}
        currentUserId={session.userId}
      />
    </AppShell>
  );
}
