import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { getStaffLeaveRequests, LeaveRecord } from "@/lib/leaves";
import { formatDate } from "@/lib/format";
import { CalendarDays, Clock, CheckCircle2, XCircle } from "@/components/ui/icons";
import { StaffLeaveClient } from "@/components/staff/staff-leave-client";

export default async function StaffLeavesPage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staffId = user?.staffId;
  const leaves: LeaveRecord[] = staffId ? await getStaffLeaveRequests(staffId) : [];

  const summary = {
    total: leaves.length,
    approved: leaves.filter((l) => l.status === "approved").length,
    pending: leaves.filter((l) => l.status === "pending").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <AppShell title="My Leaves" email={session.email} roleLabel={roleLabel} variant="staff">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Applications & History</h1>
          <p className="text-sm text-slate-500">Apply for time off, track approval status, and view past leaves.</p>
        </div>
        <StaffLeaveClient />
      </div>

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
