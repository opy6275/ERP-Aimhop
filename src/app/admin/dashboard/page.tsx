import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr, formatMonthLabel, toDateOnlyUtc } from "@/lib/format";
import { computePeriodBalance } from "@/lib/domain";
import {
  Users,
  CalendarCheck,
  CreditCard,
  Building2,
  Tags,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Activity as ActivityIcon,
} from "@/components/ui/icons";

export default async function AdminDashboardPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  const today = toDateOnlyUtc(new Date());
  const now = new Date();
  const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    staffCount,
    activeStaff,
    deptCount,
    categoryCount,
    presentToday,
    absentToday,
    leaveToday,
    halfDayToday,
    monthPayments,
    activeStaffRows,
    recentStaff,
    recentAudit,
  ] = await Promise.all([
    prisma.staff.count(),
    prisma.staff.count({ where: { status: "active" } }),
    prisma.department.count(),
    prisma.staffCategory.count(),
    prisma.attendanceRecord.count({ where: { date: today, status: "present" } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "absent" } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "leave" } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "half_day" } }),
    prisma.payment.findMany({
      where: { periodMonth },
      select: { amount: true, paymentKind: true, staffId: true },
    }),
    prisma.staff.findMany({
      where: { status: "active" },
      select: { id: true, salaryAmount: true },
    }),
    prisma.staff.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { department: true, category: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: { select: { email: true } } },
    }),
  ]);

  const monthPaid = monthPayments
    .filter((p) => !["deduction"].includes(p.paymentKind))
    .reduce((sum, p) => sum + decimalToNumber(p.amount), 0);

  let pendingTotal = 0;
  for (const s of activeStaffRows) {
    const payments = monthPayments.filter((p) => p.staffId === s.id);
    const bal = computePeriodBalance(decimalToNumber(s.salaryAmount), payments);
    pendingTotal += bal.pending;
  }

  const attendanceTotal = presentToday + absentToday + leaveToday + halfDayToday;
  const presenceRate =
    attendanceTotal > 0 ? Math.round(((presentToday + halfDayToday * 0.5) / (attendanceTotal || 1)) * 100) : 0;

  return (
    <AppShell title="Executive Overview" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Enterprise Dashboard"
        description="Unified workforce analytics, real-time presence monitoring, and financial disbursement snapshot."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles size={12} /> Live Pulse
          </span>
        }
        actions={[
          {
            label: "Add staff",
            href: "/admin/staff/new",
            icon: <Plus size={16} />,
            variant: "primary",
          },
          {
            label: "Mark attendance",
            href: "/admin/attendance",
            icon: <CalendarCheck size={16} />,
            variant: "secondary",
          },
          {
            label: "Record payment",
            href: "/admin/payments/new",
            icon: <CreditCard size={16} />,
            variant: "secondary",
          },
        ]}
      />

      {/* Attendance Pulse Bar */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Today&apos;s Workforce Presence Rate
            </h3>
            <p className="text-xs text-slate-500">
              {presentToday} Present · {halfDayToday} Half Day · {leaveToday} Leave · {absentToday} Absent
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
              {presenceRate}%
            </span>
            <span className="text-xs font-medium text-slate-400">attendance score</span>
          </div>
        </div>

        {/* Visual presence bar */}
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
          {presentToday > 0 && (
            <div
              style={{ width: `${(presentToday / (activeStaff || 1)) * 100}%` }}
              className="rounded-l-full bg-emerald-500 transition-all duration-500"
              title={`${presentToday} Present`}
            />
          )}
          {halfDayToday > 0 && (
            <div
              style={{ width: `${(halfDayToday / (activeStaff || 1)) * 100}%` }}
              className="bg-orange-400 transition-all duration-500"
              title={`${halfDayToday} Half Day`}
            />
          )}
          {leaveToday > 0 && (
            <div
              style={{ width: `${(leaveToday / (activeStaff || 1)) * 100}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`${leaveToday} On Leave`}
            />
          )}
          {absentToday > 0 && (
            <div
              style={{ width: `${(absentToday / (activeStaff || 1)) * 100}%` }}
              className="rounded-r-full bg-rose-500 transition-all duration-500"
              title={`${absentToday} Absent`}
            />
          )}
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Staff"
          value={`${activeStaff} / ${staffCount}`}
          tone="success"
          icon={<Users size={18} />}
          hint="Enrolled workforce across 5 depts"
        />
        <KpiCard
          label="Present Today"
          value={String(presentToday)}
          tone="success"
          icon={<CalendarCheck size={18} />}
          hint={`${presenceRate}% of staff present on duty`}
        />
        <KpiCard
          label="Disbursed (Month)"
          value={formatInr(monthPaid)}
          tone="primary"
          icon={<CreditCard size={18} />}
          hint={`${formatMonthLabel(periodMonth)} total payroll paid`}
        />
        <KpiCard
          label="Pending Payroll"
          value={formatInr(pendingTotal)}
          tone={pendingTotal > 0 ? "warning" : "default"}
          icon={<Clock size={18} />}
          hint="Outstanding salary balance for month"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Departments</p>
            <p className="text-base font-bold text-slate-900">{deptCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Tags size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Job Categories</p>
            <p className="text-base font-bold text-slate-900">{categoryCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CalendarCheck size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">On Approved Leave</p>
            <p className="text-base font-bold text-amber-700">{leaveToday}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <ActivityIcon size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unexcused Absences</p>
            <p className="text-base font-bold text-rose-700">{absentToday}</p>
          </div>
        </div>
      </div>

      {/* Split Panels: Recent Staff & Recent Activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Staff */}
        <Panel
          title="Workforce Directory Preview"
          subtitle="Recently onboarded team members"
          icon={<Users size={16} />}
          action={
            <Link
              href="/admin/staff"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              <span>View all staff</span>
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentStaff.map((s) => {
              const initials = s.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 font-mono text-xs font-bold text-slate-700">
                      {initials}
                    </div>
                    <div>
                      <Link
                        href={`/admin/staff/${s.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition"
                      >
                        {s.fullName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {s.staffCode} · {s.department.name} · {s.designation || s.category.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={s.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Recent Activity */}
        <Panel
          title="System Audit Stream"
          subtitle="Real-time log of administrative events"
          icon={<ShieldCheck size={16} />}
          action={
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              <span>Full audit log</span>
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentAudit.map((a) => {
              const actionColors: Record<string, string> = {
                "auth.login": "bg-blue-50 text-blue-600",
                "staff.create": "bg-emerald-50 text-emerald-600",
                "attendance.mark": "bg-purple-50 text-purple-600",
                "payments.create": "bg-amber-50 text-amber-600",
              };

              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      actionColors[a.action] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <ActivityIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{a.action}</p>
                    <p className="truncate text-xs text-slate-500">
                      {a.targetLabel || a.entityType}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatDate(a.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
