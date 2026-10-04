import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { Users, ShieldCheck, Shield, IdCard } from "@/components/ui/icons";
import { UserCreateModal } from "@/components/admin/user-create-modal";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function UsersPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  const [users, roles, staff] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: {
        role: true,
        staff: { select: { staffCode: true, fullName: true } },
      },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      where: { status: "active" },
      orderBy: { fullName: "asc" },
      select: { id: true, staffCode: true, fullName: true },
    }),
  ]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminUsers = users.filter((u) => u.role.name.toLowerCase().includes("admin")).length;
  const staffUsers = users.filter((u) => u.staff).length;

  return (
    <AppShell title="Users & Access" email={session.email} roleLabel={roleLabel} variant="admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <PageHeader
            title="User Access & Credentials"
            description="Manage authenticated CRM operator accounts, role assignments, and employee identity linking."
            breadcrumbs={[
              { label: "Admin", href: "/admin/dashboard" },
              { label: "User Accounts" },
            ]}
          />
        </div>
        <div className="shrink-0 -mt-2 sm:mt-0">
          <UserCreateModal roles={roles} staff={staff} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          label="Total User Accounts"
          value={totalUsers}
          hint="Configured credentials"
          icon={<Users size={18} />}
        />
        <KpiCard
          label="Active Accounts"
          value={activeUsers}
          hint="Can authenticate"
          tone="success"
          icon={<ShieldCheck size={18} />}
        />
        <KpiCard
          label="Admin Privileges"
          value={adminUsers}
          hint="Admin & Super Admin"
          tone="accent"
          icon={<Shield size={18} />}
        />
        <KpiCard
          label="Staff Portal Linked"
          value={staffUsers}
          hint="Self-service employees"
          icon={<IdCard size={18} />}
        />
      </div>

      {/* Users Table */}
      <DataTable headers={["User / Email", "Security Role", "Linked Employee Profile", "Status", "Last Authentication", "Actions"]}>
        {users.map((u) => {
          const initials = u.email.slice(0, 2).toUpperCase();
          const roleLower = u.role.name.toLowerCase();
          const roleBadgeColor = roleLower.includes("super")
            ? "bg-purple-50 text-purple-700 border-purple-200"
            : roleLower.includes("admin")
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200";

          return (
            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                    {initials}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{u.email}</span>
                    <span className="text-xs text-slate-400 font-mono">ID: {u.id.slice(0, 8)}…</span>
                  </div>
                </div>
              </Td>
              <Td>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColor}`}>
                  {u.role.name}
                </span>
              </Td>
              <Td>
                {u.staff ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {u.staff.staffCode}
                    </span>
                    <span className="text-slate-800 text-sm font-medium">{u.staff.fullName}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs italic">System / Unlinked</span>
                )}
              </Td>
              <Td>
                <StatusBadge value={u.isActive ? "active" : "inactive"} />
              </Td>
              <Td>
                {u.lastLoginAt ? (
                  <div>
                    <span className="text-slate-700 font-medium block">{formatDate(u.lastLoginAt)}</span>
                    <span className="text-xs text-slate-400">
                      {u.lastLoginAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Never logged in</span>
                )}
              </Td>
              <Td>
                <UserRowActions
                  user={{
                    id: u.id,
                    email: u.email,
                    isActive: u.isActive,
                    roleName: u.role.name,
                  }}
                  isCurrentSessionUser={u.id === session.userId}
                />
              </Td>
            </tr>
          );
        })}
      </DataTable>
    </AppShell>
  );
}
