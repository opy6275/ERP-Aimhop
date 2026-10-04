import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
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
  CalendarDays,
  CheckCircle2,
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
    pendingLeavesCount,
    departmentsWithCount,
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
    prisma.leaveRequest.count({ where: { status: "pending" } }),
    prisma.department.findMany({
      take: 5,
      include: { _count: { select: { staff: true } } },
      orderBy: { staff: { _count: "desc" } },
    }),
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

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now);

  return (
    <AppShell title="Executive Overview" email={session.email} roleLabel={roleLabel} variant="admin">
      {/* Executive Command Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0c1322] via-[#101b33] to-[#152342] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-xs">
                <Sparkles size={12} className="text-blue-400" />
                AimHop Enterprise Suite
              </span>
              <span className="text-xs text-slate-400">· {dateLabel}</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              {greeting}, <span className="text-blue-400">Administrator</span>
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Workforce operations, real-time presence telemetry, and payroll disbursement command desk.
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/staff/new"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-95"
            >
              <Plus size={16} />
              <span>Onboard Staff</span>
            </Link>

            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-xs transition hover:bg-slate-700 hover:text-white"
            >
              <CalendarCheck size={16} className="text-blue-400" />
              <span>Daily Attendance</span>
            </Link>

            <Link
              href="/admin/payments/new"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-xs transition hover:bg-slate-700 hover:text-white"
            >
              <CreditCard size={16} className="text-emerald-400" />
              <span>Record Payout</span>
            </Link>

            {pendingLeavesCount > 0 && (
              <Link
                href="/admin/leaves"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30 animate-pulse"
              >
                <CalendarDays size={16} />
                <span>{pendingLeavesCount} Pending Leave{pendingLeavesCount > 1 ? "s" : ""}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Pulse Bar — High Tech Visual Gauge */}
      <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CalendarCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Today&apos;s Workforce Telemetry & Presence
                </h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Live Shift
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Active shift roster: {presentToday} Present · {halfDayToday} Half Day · {leaveToday} On Leave · {absentToday} Unexcused Absent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black tracking-tight text-emerald-600 tabular-nums">
                  {presenceRate}%
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Presence Score</p>
            </div>
          </div>
        </div>

        {/* Visual presence segmented bar */}
        <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
          {presentToday > 0 && (
            <div
              style={{ width: `${(presentToday / (activeStaff || 1)) * 100}%` }}
              className="rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 shadow-xs"
              title={`${presentToday} Present`}
            />
          )}
          {halfDayToday > 0 && (
            <div
              style={{ width: `${(halfDayToday / (activeStaff || 1)) * 100}%` }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
              title={`${halfDayToday} Half Day`}
            />
          )}
          {leaveToday > 0 && (
            <div
              style={{ width: `${(leaveToday / (activeStaff || 1)) * 100}%` }}
              className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              title={`${leaveToday} On Approved Leave`}
            />
          )}
          {absentToday > 0 && (
            <div
              style={{ width: `${(absentToday / (activeStaff || 1)) * 100}%` }}
              className="rounded-r-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
              title={`${absentToday} Absent`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Present ({presentToday})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
            <span>Half Day ({halfDayToday})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Approved Leave ({leaveToday})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>Absent ({absentToday})</span>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Workforce"
          value={`${activeStaff} / ${staffCount}`}
          tone="success"
          icon={<Users size={20} />}
          hint={`${deptCount} departments enrolled`}
          trend={{ label: "Active", positive: true }}
        />
        <KpiCard
          label="Present On Duty"
          value={String(presentToday)}
          tone="primary"
          icon={<CalendarCheck size={20} />}
          hint={`${presenceRate}% of staff checked in`}
          trend={{ label: `${presenceRate}%`, positive: presenceRate >= 75 }}
        />
        <KpiCard
          label="Disbursed (Month)"
          value={formatInr(monthPaid)}
          tone="accent"
          icon={<CreditCard size={20} />}
          hint={`${formatMonthLabel(periodMonth)} payroll payouts`}
        />
        <KpiCard
          label="Pending Payroll"
          value={formatInr(pendingTotal)}
          tone={pendingTotal > 0 ? "warning" : "default"}
          icon={<Clock size={20} />}
          hint="Calculated outstanding balance"
        />
      </div>

      {/* Department Distribution Bar & Headcount Overview */}
      <div className="mt-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Departmental Workforce Allocation
            </h3>
            <p className="text-xs text-slate-500 font-medium">Headcount distribution across operating units</p>
          </div>
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <span>Manage departments ({deptCount})</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {departmentsWithCount.map((dept, i) => {
            const count = dept._count.staff;
            const pct = activeStaff > 0 ? Math.round((count / activeStaff) * 100) : 0;
            const colors = [
              "border-blue-200 bg-blue-50/50 text-blue-900",
              "border-indigo-200 bg-indigo-50/50 text-indigo-900",
              "border-purple-200 bg-purple-50/50 text-purple-900",
              "border-emerald-200 bg-emerald-50/50 text-emerald-900",
              "border-amber-200 bg-amber-50/50 text-amber-900",
            ];
            const cls = colors[i % colors.length];

            return (
              <div key={dept.id} className={`rounded-xl border p-3.5 transition hover:shadow-xs ${cls}`}>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-bold">{dept.name}</p>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">{pct}%</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-black tabular-nums">{count}</span>
                  <span className="text-[11px] font-medium text-slate-500">members</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-blue-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Panels: Recent Staff & Recent Audit Stream */}
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {/* Recent Staff */}
        <Panel
          title="Recent Onboardings"
          subtitle="Latest employees registered in the system"
          icon={<Users size={16} />}
          action={
            <Link
              href="/admin/staff"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>View all staff ({staffCount})</span>
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
                  className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-100 to-blue-50 font-mono text-xs font-black text-blue-800 border border-blue-100/60 shadow-2xs">
                      {initials}
                    </div>
                    <div>
                      <Link
                        href={`/admin/staff/${s.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                      >
                        {s.fullName}
                      </Link>
                      <p className="text-xs text-slate-400 font-medium">
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
          title="Security & Audit Stream"
          subtitle="Real-time log of administrative events"
          icon={<ShieldCheck size={16} />}
          action={
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>Full audit log</span>
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentAudit.map((a) => {
              const actionColors: Record<string, string> = {
                "auth.login": "bg-blue-50 text-blue-600 border border-blue-100",
                "staff.create": "bg-emerald-50 text-emerald-600 border border-emerald-100",
                "attendance.mark": "bg-purple-50 text-purple-600 border border-purple-100",
                "payments.create": "bg-amber-50 text-amber-600 border border-amber-100",
                "leave.approve": "bg-emerald-50 text-emerald-600 border border-emerald-100",
                "leave.reject": "bg-rose-50 text-rose-600 border border-rose-100",
              };

              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                      actionColors[a.action] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <ActivityIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">{a.action}</p>
                    <p className="truncate text-xs text-slate-500 font-medium">
                      {a.targetLabel || a.entityType}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-mono text-slate-400">
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
