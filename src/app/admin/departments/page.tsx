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
        <>
          {/* Mobile Card List (< md) */}
          <div className="space-y-3 md:hidden">
            {departments.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100/80">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{d.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {d.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
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
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                      {d.code || "—"}
                    </span>
                    <span className="font-semibold text-slate-700 bg-blue-50/80 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-100/60 text-xs">
                      {d._count.staff} members
                    </span>
                  </div>
                  <StatusBadge value={d.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Data Table (>= md) */}
          <div className="hidden md:block">
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
          </div>
        </>
      )}
    </AppShell>
  );
}
