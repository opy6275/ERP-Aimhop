import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { DepartmentForm } from "@/components/admin/department-form";
import { DepartmentActions } from "@/components/admin/department-actions";
import {
  OrganizationHierarchyView,
  DepartmentNode,
} from "@/components/admin/organization-hierarchy-view";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatInr, decimalToNumber } from "@/lib/format";
import { Building2, Crown, Network, ListFilter } from "@/components/ui/icons";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const sp = await searchParams;
  const activeTab = sp.tab === "organogram" ? "organogram" : "list";

  const [departments, activeStaff, company] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        staff: {
          where: { status: "active" },
          select: {
            id: true,
            fullName: true,
            staffCode: true,
            designation: true,
            photoUrl: true,
            email: true,
            salaryAmount: true,
            status: true,
          },
        },
      },
    }),
    prisma.staff.findMany({
      where: { status: "active" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        staffCode: true,
        designation: true,
      },
    }),
    prisma.company.findFirst(),
  ]);

  // Extract all Head of Department IDs
  const headIds = departments
    .map((d) => d.headStaffId)
    .filter((id): id is string => Boolean(id));

  const heads =
    headIds.length > 0
      ? await prisma.staff.findMany({
          where: { id: { in: headIds } },
          select: {
            id: true,
            fullName: true,
            staffCode: true,
            designation: true,
            photoUrl: true,
            email: true,
          },
        })
      : [];

  const headMap = new Map(heads.map((h) => [h.id, h]));

  // Structure department nodes for the hierarchy tree
  const hierarchyNodes: DepartmentNode[] = departments.map((d) => {
    const head = d.headStaffId ? headMap.get(d.headStaffId) || null : null;
    const salarySum = d.staff.reduce(
      (sum, s) => sum + decimalToNumber(s.salaryAmount),
      0
    );

    return {
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      status: d.status,
      headStaff: head
        ? {
            id: head.id,
            fullName: head.fullName,
            staffCode: head.staffCode,
            designation: head.designation,
            photoUrl: head.photoUrl,
            email: head.email,
          }
        : null,
      staff: d.staff.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        staffCode: s.staffCode,
        designation: s.designation,
        photoUrl: s.photoUrl,
        email: s.email,
        salaryAmount: decimalToNumber(s.salaryAmount),
      })),
      totalSalaryCommitment: salarySum,
    };
  });

  return (
    <AppShell title="Departments & Hierarchy" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Organizational Structure & Departments"
        description="Configure internal business units, assign department leadership (HOD), and explore the interactive organogram."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Workforce", href: "/admin/staff" },
          { label: "Departments" },
        ]}
      />

      {/* View Switcher Navigation Tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/departments?tab=list"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "list"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ListFilter size={16} />
            <span>Departments Directory</span>
          </Link>

          <Link
            href="/admin/departments?tab=organogram"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "organogram"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Network size={16} />
            <span>Organogram & Hierarchy Tree</span>
          </Link>
        </div>

        {activeTab === "list" && (
          <div>
            <DepartmentForm staff={activeStaff} />
          </div>
        )}
      </div>

      {activeTab === "organogram" ? (
        <OrganizationHierarchyView
          companyName={company?.name || "AimHop Technologies"}
          legalName={company?.legalName || "AimHop Solutions Pvt. Ltd."}
          departments={hierarchyNodes}
        />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create engineering, HR, sales, and operations business units."
        />
      ) : (
        <>
          {/* Mobile Card List (< md) */}
          <div className="space-y-3 md:hidden">
            {departments.map((d) => {
              const head = d.headStaffId ? headMap.get(d.headStaffId) : null;
              const salarySum = d.staff.reduce(
                (sum, s) => sum + decimalToNumber(s.salaryAmount),
                0
              );

              return (
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
                          staffCount: d.staff.length,
                          headStaffId: d.headStaffId,
                        }}
                        staff={activeStaff}
                      />
                    </div>
                  </div>

                  {/* HOD & Budget Row */}
                  <div className="mt-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">HOD</span>
                      <span className="font-medium text-slate-800">
                        {head ? head.fullName : <span className="text-slate-400 italic">Unassigned</span>}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Commitment</span>
                      <span className="font-mono font-bold text-slate-900">{formatInr(salarySum)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                        {d.code || "—"}
                      </span>
                      <span className="font-semibold text-slate-700 bg-blue-50/80 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-100/60 text-xs">
                        {d.staff.length} members
                      </span>
                    </div>
                    <StatusBadge value={d.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Data Table (>= md) */}
          <div className="hidden md:block">
            <DataTable
              headers={[
                "Department Unit",
                "Code",
                "Head of Department (HOD)",
                "Active Workforce",
                "Salary Commitment",
                "Status",
                "Created On",
                "Actions",
              ]}
            >
              {departments.map((d) => {
                const head = d.headStaffId ? headMap.get(d.headStaffId) : null;
                const salarySum = d.staff.reduce(
                  (sum, s) => sum + decimalToNumber(s.salaryAmount),
                  0
                );

                return (
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
                    <Td>
                      {head ? (
                        <div className="flex items-center gap-2">
                          <Crown size={14} className="text-amber-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-xs text-slate-900">{head.fullName}</p>
                            <p className="text-[11px] text-slate-400">{head.designation || head.staffCode}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </Td>
                    <Td mono className="font-semibold text-slate-900">
                      {d.staff.length} members
                    </Td>
                    <Td mono className="font-semibold text-slate-900">
                      {formatInr(salarySum)}
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
                          staffCount: d.staff.length,
                          headStaffId: d.headStaffId,
                        }}
                        staff={activeStaff}
                      />
                    </Td>
                  </tr>
                );
              })}
            </DataTable>
          </div>
        </>
      )}
    </AppShell>
  );
}
