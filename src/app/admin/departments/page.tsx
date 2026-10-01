import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { DepartmentForm } from "@/components/admin/department-form";
import { DepartmentActions } from "@/components/admin/department-actions";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Building2 } from "@/components/ui/icons";

export default async function DepartmentsPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { staff: { where: { status: "active" } } } } },
  });

  return (
    <AppShell title="Departments" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Organizational Departments"
        description="Configure internal business units, teams, and active headcount assignments."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Workforce", href: "/admin/staff" },
          { label: "Departments" },
        ]}
      />

      <div className="mb-6">
        <DepartmentForm />
      </div>

      {departments.length === 0 ? (
        <EmptyState title="No departments found" description="Create engineering, HR, sales, and operations units." />
      ) : (
        <DataTable headers={["Department Unit", "Code", "Active Workforce", "Status", "Created On", "Actions"]}>
          {departments.map((d) => (
            <tr key={d.id} className="transition-colors hover:bg-blue-50/30">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.description || "—"}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {d.code || "—"}
                </span>
              </Td>
              <Td mono className="font-semibold text-slate-900">
                {d._count.staff} members
              </Td>
              <Td>
                <StatusBadge value={d.status} />
              </Td>
              <Td className="text-xs text-slate-500">{formatDate(d.createdAt)}</Td>
              <Td>
                <DepartmentActions
                  department={{
                    id: d.id,
                    name: d.name,
                    code: d.code,
                    description: d.description,
                    status: d.status,
                    staffCount: d._count.staff,
                  }}
                />
              </Td>
            </tr>
          ))}
        </DataTable>
      )}
    </AppShell>
  );
}
