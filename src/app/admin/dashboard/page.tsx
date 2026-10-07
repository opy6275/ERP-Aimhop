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
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Activity as ActivityIcon,
  CalendarDays,
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
    attendanceGroups,
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
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { date: today },
      _count: { _all: true },
    }),
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

  const attCounts: Record<string, number> = {};
  for (const g of attendanceGroups) {
    attCounts[g.status] = g._count._all;
  }
  const presentToday = attCounts["present"] ?? 0;
  const absentToday = attCounts["absent"] ?? 0;
  const leaveToday = attCounts["leave"] ?? 0;
  const halfDayToday = attCounts["half_day"] ?? 0;

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
    <AppShell title="Dashboard" email={session.email} roleLabel={roleLabel} variant="admin">
      {/* Welcome Banner */}
      <div className="relative mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">{dateLabel}</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {greeting}, <span className="text-blue-600">Admin</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Executive overview and daily operations summary.
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/staff/new"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95"
            >
              <Plus size={16} />
              <span>Add Staff</span>
            </Link>

            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <CalendarCheck size={16} className="text-blue-600" />
              <span>Attendance</span>
            </Link>

            <Link
              href="/admin/payments/new"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <CreditCard size={16} className="text-emerald-600" />
              <span>Record Payment</span>
            </Link>

            {pendingLeavesCount > 0 && (
              <Link
                href="/admin/leaves"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
              >
                <CalendarDays size={16} className="text-amber-600" />
                <span>{pendingLeavesCount} Pending Leave{pendingLeavesCount > 1 ? "s" : ""}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Today&apos;s Attendance
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {presentToday} Present · {halfDayToday} Half Day · {leaveToday} Leave · {absentToday} Absent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-2xl font-black tracking-tight text-emerald-600 tabular-nums">
                {presenceRate}%
              </span>
              <p className="text-[11px] font-medium text-slate-500">Attendance Rate</p>
            </div>
          </div>
        </div>

        {/* Visual presence segmented bar */}
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
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
              title={`${leaveToday} Leave`}
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

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
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
            <span>Leave ({leaveToday})</span>
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
          label="Total Staff"
          value={`${activeStaff} / ${staffCount}`}
          tone="success"
          icon={<Users size={20} />}
          hint={`${deptCount} departments`}
          trend={{ label: "Active", positive: true }}
        />
        <KpiCard
          label="Present Today"
          value={String(presentToday)}
          tone="primary"
          icon={<CalendarCheck size={20} />}
          hint={`${presenceRate}% present`}
          trend={{ label: `${presenceRate}%`, positive: presenceRate >= 75 }}
        />
        <KpiCard
          label="Paid This Month"
          value={formatInr(monthPaid)}
          tone="accent"
          icon={<CreditCard size={20} />}
          hint={formatMonthLabel(periodMonth)}
        />
        <KpiCard
          label="Pending Salary"
          value={formatInr(pendingTotal)}
          tone={pendingTotal > 0 ? "warning" : "default"}
          icon={<Clock size={20} />}
          hint="Outstanding balance"
        />
      </div>

      {/* Department Breakdown */}
      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Department Breakdown
            </h3>
            <p className="text-xs text-slate-500 font-medium">Staff distribution across departments</p>
          </div>
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <span>View departments ({deptCount})</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {departmentsWithCount.map((dept) => {
            const count = dept._count.staff;
            const pct = activeStaff > 0 ? Math.round((count / activeStaff) * 100) : 0;

            return (
              <div key={dept.id} className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-bold text-slate-800">{dept.name}</p>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono">{pct}%</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">{count}</span>
                  <span className="text-[11px] font-medium text-slate-500">members</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-blue-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Panels: Recent Staff & Recent Activity */}
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {/* Recent Staff */}
        <Panel
          title="Recent Staff"
          subtitle="Recently added team members"
          icon={<Users size={16} />}
          action={
            <Link
              href="/admin/staff"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>View all ({staffCount})</span>
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-200">
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
          title="Recent Activity"
          subtitle="Latest actions and updates"
          icon={<ShieldCheck size={16} />}
          action={
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>View logs</span>
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
