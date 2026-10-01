import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatInr } from "@/lib/format";
import { Users, Building2, Tags, CreditCard } from "@/components/ui/icons";

export default async function ReportsPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  const [byDept, byCat, active, inactive, totalStaff, payments] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { staff: { where: { status: "active" } } } } },
    }),
    prisma.staffCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { staff: true } } },
    }),
    prisma.staff.count({ where: { status: "active" } }),
    prisma.staff.count({ where: { status: "inactive" } }),
    prisma.staff.count(),
    prisma.payment.findMany({ select: { amount: true, paymentKind: true } }),
  ]);

  const totalPaid = payments
    .filter((p) => p.paymentKind !== "deduction")
    .reduce((s, p) => s + decimalToNumber(p.amount), 0);

  return (
    <AppShell title="Analytics & Reports" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Workforce & Financial Reports"
        description="High-level demographic distributions, department headcount allocation, and cumulative payout analysis."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Analytics", href: "/admin/reports" },
          { label: "Reports" },
        ]}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Active Staff Headcount"
          value={`${active} / ${totalStaff}`}
          tone="success"
          icon={<Users size={18} />}
          hint={`${inactive} inactive accounts archived`}
        />
        <KpiCard
          label="Cumulative Payroll"
          value={formatInr(totalPaid)}
          tone="primary"
          icon={<CreditCard size={18} />}
          hint="All recorded historical disbursements"
        />
        <KpiCard
          label="Active Departments"
          value={String(byDept.length)}
          tone="default"
          icon={<Building2 size={18} />}
          hint="Operational business units"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department-wise Breakdown */}
        <Panel
          title="Headcount by Department"
          subtitle="Staff distribution across business units"
          icon={<Building2 size={16} />}
        >
          <div className="space-y-4">
            {byDept.map((d) => {
              const pct = Math.round(((d._count.staff || 0) / (active || 1)) * 100);
              return (
                <div key={d.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{d.name}</span>
                    <span className="text-slate-500 font-mono">
                      {d._count.staff} staff ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Category-wise Breakdown */}
        <Panel
          title="Headcount by Employment Category"
          subtitle="Permanent, Contractual, and Internship breakdown"
          icon={<Tags size={16} />}
        >
          <div className="space-y-4">
            {byCat.map((c) => {
              const pct = Math.round(((c._count.staff || 0) / (totalStaff || 1)) * 100);
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{c.name}</span>
                    <span className="text-slate-500 font-mono">
                      {c._count.staff} staff ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
