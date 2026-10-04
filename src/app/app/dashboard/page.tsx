import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr, formatMonthLabel, toDateOnlyUtc } from "@/lib/format";
import { computePeriodBalance } from "@/lib/domain";
import { StaffCheckinCard } from "@/components/staff/staff-checkin-card";
import {
  CalendarCheck,
  CreditCard,
  Clock,
  CalendarDays,
  Receipt,
  User as UserIcon,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "@/components/ui/icons";

export default async function StaffDashboardPage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staffId = user?.staffId;
  const staff = staffId
    ? await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          department: true,
          category: true,
        },
      })
    : null;

  const today = toDateOnlyUtc(new Date());
  const now = new Date();
  const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    todayAttendance,
    monthPayments,
    monthAttendanceCount,
    recentAttendance,
    recentPayments,
    recentLeaves,
  ] = staffId
    ? await Promise.all([
        prisma.attendanceRecord.findUnique({
          where: { staffId_date: { staffId, date: today } },
        }),
        prisma.payment.findMany({
          where: { staffId, periodMonth },
        }),
        prisma.attendanceRecord.count({
          where: { staffId, date: { gte: periodMonth }, status: "present" },
        }),
        prisma.attendanceRecord.findMany({
          where: { staffId },
          orderBy: { date: "desc" },
          take: 5,
        }),
        prisma.payment.findMany({
          where: { staffId },
          orderBy: { paymentDate: "desc" },
          take: 5,
          include: { receipt: true },
        }),
        prisma.leaveRequest.findMany({
          where: { staffId },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ])
    : [null, [], 0, [], [], []];

  const salary = staff ? decimalToNumber(staff.salaryAmount) : 0;
  const balance = staff ? computePeriodBalance(salary, monthPayments) : { paid: 0, pending: 0 };

  const initials = staff?.fullName
    ? staff.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "EM";

  return (
    <AppShell title="Employee Hub" email={session.email} roleLabel={roleLabel} variant="staff">
      {/* Employee Executive Hero Card */}
      <div className="relative mb-7 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0c1322] via-[#101b33] to-[#152342] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-mono text-xl sm:text-2xl font-black text-white shadow-lg ring-4 ring-white/10">
              {initials}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {staff?.fullName || "Employee"}
                </h1>
                <span className="rounded-md border border-blue-400/40 bg-blue-500/20 px-2 py-0.5 text-xs font-mono font-bold text-blue-300">
                  {staff?.staffCode || "STAFF-00000"}
                </span>
                <span className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  {staff?.status || "Active"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {staff?.designation || "Staff Member"} ·{" "}
                <span className="text-blue-400 font-semibold">{staff?.department.name}</span> (
                {staff?.category.name})
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span>Contact: {staff?.mobile || "Not specified"}</span>
                <span>·</span>
                <span>Work Email: {staff?.email || session.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/app/leaves"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95"
            >
              <Plus size={16} />
              <span>Apply for Leave</span>
            </Link>

            <Link
              href="/app/receipts"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-xs transition hover:bg-slate-700 hover:text-white"
            >
              <Receipt size={16} className="text-blue-400" />
              <span>My Salary Slips</span>
            </Link>

            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-xs transition hover:bg-slate-700 hover:text-white"
            >
              <UserIcon size={16} className="text-slate-400" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Shift Check-in Card */}
      {staff && (
        <StaffCheckinCard
          todayStatus={todayAttendance?.status || null}
          todayNote={todayAttendance?.note || null}
          employeeName={staff.fullName}
        />
      )}

      {/* 4 Financial & Operational Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Shift Status"
          value={todayAttendance ? todayAttendance.status.toUpperCase().replace("_", " ") : "Not Marked"}
          tone={
            todayAttendance?.status === "present"
              ? "success"
              : todayAttendance?.status === "leave"
              ? "warning"
              : "default"
          }
          icon={<CalendarCheck size={20} />}
          hint="Daily roster attendance status"
        />

        <KpiCard
          label="Contract Monthly Salary"
          value={formatInr(salary)}
          tone="primary"
          icon={<CreditCard size={20} />}
          hint={`Fixed compensation / ${staff?.paymentType || "monthly"}`}
        />

        <KpiCard
          label="Disbursed This Month"
          value={formatInr(balance.paid)}
          tone="success"
          icon={<CheckCircle2 size={20} />}
          hint={`${formatMonthLabel(periodMonth)} total paid`}
          trend={{ label: "Processed", positive: true }}
        />

        <KpiCard
          label="Pending Balance"
          value={formatInr(balance.pending)}
          tone={balance.pending > 0 ? "warning" : "default"}
          icon={<Clock size={20} />}
          hint="Remaining balance for current month"
        />
      </div>

      {/* Split Panels: Recent Attendance & Leave Tracker, and Payments */}
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {/* Left: Attendance & Leaves summary */}
        <div className="space-y-6">
          <Panel
            title="Attendance Activity"
            subtitle={`${monthAttendanceCount} days logged on duty this month`}
            icon={<CalendarCheck size={16} />}
            action={
              <Link
                href="/app/attendance"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <span>Full attendance history</span>
                <ArrowUpRight size={14} />
              </Link>
            }
          >
            {recentAttendance.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No attendance records logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAttendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">{formatDate(a.date)}</span>
                      {a.note && <p className="text-[11px] text-slate-400">Note: {a.note}</p>}
                    </div>
                    <StatusBadge value={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Leave Requests preview */}
          <Panel
            title="My Leave Requests"
            subtitle="Recent applications & status"
            icon={<CalendarDays size={16} />}
            action={
              <Link
                href="/app/leaves"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <span>Apply / View all</span>
                <ArrowUpRight size={14} />
              </Link>
            }
          >
            {recentLeaves.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">No leave requests submitted.</p>
                <Link
                  href="/app/leaves"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Plus size={14} />
                  <span>Request time off</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-900 capitalize">
                        {l.leaveType} Leave · {formatDate(l.startDate)}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{l.reason}</p>
                    </div>
                    <StatusBadge value={l.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Right: Recent Payments & Receipts */}
        <Panel
          title="Recent Salary Slips & Disbursements"
          subtitle="Official payment records and digital vouchers"
          icon={<CreditCard size={16} />}
          action={
            <Link
              href="/app/payments"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>View all transactions</span>
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          {recentPayments.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No payments disbursed yet for your profile.</p>
          ) : (
            <DataTable headers={["Disbursement Date", "Period", "Amount", "Method", "Slip / Receipt"]}>
              {recentPayments.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50/60">
                  <Td className="text-xs font-medium text-slate-900">{formatDate(p.paymentDate)}</Td>
                  <Td className="text-xs text-slate-600 font-medium">{formatMonthLabel(p.periodMonth)}</Td>
                  <Td mono className="text-xs font-bold text-slate-900">{formatInr(decimalToNumber(p.amount))}</Td>
                  <Td className="text-xs capitalize font-medium text-slate-600">{p.paymentMethod.replace("_", " ")}</Td>
                  <Td>
                    {p.receipt ? (
                      <Link
                        href="/app/receipts"
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                      >
                        <Receipt size={12} />
                        <span>{p.receipt.receiptNumber}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
