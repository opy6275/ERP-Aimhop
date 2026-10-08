import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { getStaffLeaveRequests, getOrCreateStaffLeaveBalance, LeaveRecord } from "@/lib/leaves";
import { formatDate } from "@/lib/format";
import { CalendarDays, Clock, CheckCircle2, XCircle, ShieldCheck } from "@/components/ui/icons";
import { StaffLeaveClient } from "@/components/staff/staff-leave-client";

export default async function StaffLeavesPage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staffId = user?.staffId;
  const [leaves, leaveBalance] = await Promise.all([
    staffId ? getStaffLeaveRequests(staffId) : Promise.resolve([]),
    staffId ? getOrCreateStaffLeaveBalance(staffId) : Promise.resolve(null),
  ]);

  const summary = {
    total: leaves.length,
    approved: leaves.filter((l) => l.status === "approved").length,
    pending: leaves.filter((l) => l.status === "pending").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <AppShell title="My Leaves" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title="Leave Requests & Quotas"
        description="Monitor your annual leave balances, submit time off requests, and track administrative decisions."
        breadcrumbs={[
          { label: "Staff Portal", href: "/app/dashboard" },
          { label: "Leaves" },
        ]}
        actionNode={<StaffLeaveClient leaveBalance={leaveBalance} />}
      />

      {/* Annual Leave Quotas (CL / SL / PL) */}
      {leaveBalance && (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Annual Leave Balances & Entitlements ({leaveBalance.year})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Casual Leave */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold text-slate-700">Casual Leave (CL)</span>
                <span className="text-[11px] font-semibold text-slate-400">{leaveBalance.clTotal} days/yr</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-black text-blue-700 tabular-nums">{leaveBalance.clRemaining}</span>
                  <span className="text-xs text-slate-500 ml-1">days left</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Used: {leaveBalance.clUsed}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (leaveBalance.clUsed / leaveBalance.clTotal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Sick Leave */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold text-slate-700">Sick Leave (SL)</span>
                <span className="text-[11px] font-semibold text-slate-400">{leaveBalance.slTotal} days/yr</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-black text-emerald-700 tabular-nums">{leaveBalance.slRemaining}</span>
                  <span className="text-xs text-slate-500 ml-1">days left</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Used: {leaveBalance.slUsed}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (leaveBalance.slUsed / leaveBalance.slTotal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Paid / Privilege Leave */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold text-slate-700">Paid Leave (PL)</span>
                <span className="text-[11px] font-semibold text-slate-400">{leaveBalance.plTotal} days/yr</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-black text-purple-700 tabular-nums">{leaveBalance.plRemaining}</span>
                  <span className="text-xs text-slate-500 ml-1">days left</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Used: {leaveBalance.plUsed}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (leaveBalance.plUsed / leaveBalance.plTotal) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Applied"
          value={String(summary.total)}
          tone="default"
          icon={<CalendarDays size={18} />}
          hint="All time requests"
        />
        <KpiCard
          label="Pending Review"
          value={String(summary.pending)}
          tone={summary.pending > 0 ? "warning" : "default"}
          icon={<Clock size={18} />}
          hint="Awaiting admin action"
        />
        <KpiCard
          label="Approved Leaves"
          value={String(summary.approved)}
          tone="success"
          icon={<CheckCircle2 size={18} />}
          hint="Excused time off"
        />
        <KpiCard
          label="Rejected"
          value={String(summary.rejected)}
          tone={summary.rejected > 0 ? "danger" : "default"}
          icon={<XCircle size={18} />}
          hint="Declined requests"
        />
      </div>

      <Panel title="Leave Request History" subtitle="Track administrative approvals and review comments.">
        <DataTable headers={["Dates", "Days", "Type", "Reason", "Status", "Review Remarks", "Applied On"]}>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-500">
                No leave requests submitted yet. Click &apos;Apply for Leave&apos; to submit your first request.
              </td>
            </tr>
          ) : (
            leaves.map((leave) => {
              const startFmt = formatDate(new Date(leave.startDate));
              const endFmt = formatDate(new Date(leave.endDate));
              const dateStr = startFmt === endFmt ? startFmt : `${startFmt} – ${endFmt}`;

              return (
                <tr key={leave.id} className="transition hover:bg-slate-50/70">
                  <Td className="font-medium text-slate-900">{dateStr}</Td>
                  <Td className="tabular-nums font-semibold text-slate-700">
                    {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"}
                  </Td>
                  <Td>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                      {leave.leaveType}
                    </span>
                  </Td>
                  <Td className="max-w-xs truncate text-slate-600">
                    <span title={leave.reason}>{leave.reason}</span>
                  </Td>
                  <Td>
                    <StatusBadge value={leave.status} />
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {leave.reviewNote ? (
                      <span className="italic text-slate-700">&ldquo;{leave.reviewNote}&rdquo;</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </Td>
                  <Td className="text-xs text-slate-400">{formatDate(new Date(leave.createdAt))}</Td>
                </tr>
              );
            })
          )}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
