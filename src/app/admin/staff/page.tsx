import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatInr } from "@/lib/format";
import { UserPlus, Search, Filter } from "@/components/ui/icons";

export default async function StaffListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; departmentId?: string }>;
}) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status === "inactive" ? "inactive" : sp.status === "active" ? "active" : undefined;

  const [departments, staff] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(sp.departmentId ? { departmentId: sp.departmentId } : {}),
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
      },
      orderBy: { fullName: "asc" },
      include: {
        department: true,
        category: true,
      },
    }),
  ]);

  return (
    <AppShell title="Staff Directory" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Employee Roster"
        description="Search, manage profiles, compensation, and organizational alignment across departments."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Workforce", href: "/admin/staff" },
          { label: "All Staff" },
        ]}
        actions={[
          {
            label: "Add new staff",
            href: "/admin/staff/new",
            icon: <UserPlus size={16} />,
            variant: "primary",
          },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, employee ID, email, or mobile..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9.5 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              name="departmentId"
              defaultValue={sp.departmentId ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={sp.status ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer"
            >
              <Filter size={14} />
              <span>Filter</span>
            </button>

            {(q || sp.departmentId || sp.status) && (
              <Link
                href="/admin/staff"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Staff Table */}
      {staff.length === 0 ? (
        <EmptyState
          title="No employees found"
          description={
            q || sp.departmentId || sp.status
              ? "No team members match your filter criteria. Try adjusting the search parameters."
              : "Onboard your first team member to begin attendance logging and payroll processing."
          }
          action={{ label: "Add new staff", href: "/admin/staff/new" }}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-medium text-slate-500">
            <span>Showing {staff.length} staff members</span>
          </div>

          <DataTable
            headers={[
              "Employee",
              "Department",
              "Employment Type",
              "Monthly Salary",
              "Contact",
              "Status",
              "Action",
            ]}
          >
            {staff.map((s) => {
              const initials = s.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);

              return (
                <tr key={s.id} className="transition-colors hover:bg-blue-50/30">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 font-mono text-xs font-bold text-blue-800 shadow-2xs">
                        {initials}
                      </div>
                      <div>
                        <Link
                          href={`/admin/staff/${s.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition"
                        >
                          {s.fullName}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {s.staffCode} {s.designation ? `· ${s.designation}` : ""}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {s.department.name}
                    </span>
                  </Td>
                  <Td className="text-slate-600">{s.category.name}</Td>
                  <Td mono className="font-semibold text-slate-900">
                    {formatInr(Number(s.salaryAmount))}
                    <span className="ml-1 text-[11px] font-normal text-slate-400 capitalize">
                      /{s.paymentType === "daily" ? "day" : "mo"}
                    </span>
                  </Td>
                  <Td className="text-xs text-slate-500">
                    <p>{s.mobile || "—"}</p>
                    <p className="text-slate-400">{s.email || "—"}</p>
                    {s.dateOfBirth && (
                      <p className="text-[11px] text-blue-600/80 font-medium mt-0.5">
                        DOB: {formatDate(s.dateOfBirth)}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge value={s.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link
                        href={`/admin/staff/${s.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-slate-50"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/staff/${s.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200/80 bg-blue-50/70 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100"
                      >
                        Edit
                      </Link>
                    </div>
                  </Td>

                </tr>
              );
            })}
          </DataTable>
        </div>
      )}
    </AppShell>
  );
}
