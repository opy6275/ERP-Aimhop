import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate, toDateOnlyUtc } from "@/lib/format";
import { StaffCheckinCard } from "@/components/staff/staff-checkin-card";
import { StaffMonthlySheetModal } from "@/components/attendance/staff-monthly-sheet-modal";

export default async function StaffAttendancePage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staffId = user?.staffId;
  const today = toDateOnlyUtc(new Date());

  const [staff, todayAttendance, records] = staffId
    ? await Promise.all([
        prisma.staff.findUnique({
          where: { id: staffId },
          select: { fullName: true, staffCode: true },
        }),
        prisma.attendanceRecord.findUnique({
          where: { staffId_date: { staffId, date: today } },
        }),
        prisma.attendanceRecord.findMany({
          where: { staffId },
          orderBy: { date: "desc" },
          take: 60,
        }),
      ])
    : [null, null, []];

  const summary = {
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    holiday: 0,
  };
  for (const r of records) {
    const appStatus = (r as Record<string, any>).approvalStatus;
    if (appStatus === "approved" || !appStatus) {
      if (r.status in summary) {
        summary[r.status as keyof typeof summary]++;
      }
    }
  }

  // Monthly attendance calculations (based on total days in current calendar month)
  const now = new Date();
  const currentMonthDays = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).getUTCDate();
  const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthRecords = records.filter((r) => new Date(r.date) >= currentMonthStart);
  let monthPresent = 0;
  let monthHalfDay = 0;
  for (const r of monthRecords) {
    const appStatus = (r as Record<string, any>).approvalStatus;
    if (appStatus === "approved" || !appStatus) {
      if (r.status === "present") monthPresent++;
      else if (r.status === "half_day") monthHalfDay++;
    }
  }
  const monthAttended = monthPresent + monthHalfDay * 0.5;
  const monthPercentage = currentMonthDays > 0 ? Math.round((monthAttended / currentMonthDays) * 1000) / 10 : 0;

  return (
    <AppShell title="My Attendance" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title="Shift & Attendance Records"
        description="Track monthly attendance rate, daily shift status, and submission logs."
        breadcrumbs={[
          { label: "Staff Portal", href: "/app/dashboard" },
          { label: "Attendance" },
        ]}
        actionNode={<StaffMonthlySheetModal initialStaff={staff || undefined} />}
      />

      {staff && (
        <StaffCheckinCard
          todayStatus={todayAttendance?.status || null}
          todayApprovalStatus={(todayAttendance as Record<string, any>)?.approvalStatus || null}
          todayNote={todayAttendance?.note || null}
          employeeName={staff.fullName}
        />
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Monthly Rate"
          value={`${monthPercentage}%`}
          tone={monthPercentage >= 75 ? "success" : "default"}
          icon="chart"
          hint={`${monthAttended} / ${currentMonthDays} Days this month`}
        />
        <KpiCard label="Present Days" value={String(summary.present)} tone="success" icon="calendar" hint="Logged presence" />
        <KpiCard label="Absent Days" value={String(summary.absent)} tone={summary.absent > 0 ? "danger" : "default"} icon="users" hint="Unexcused shifts" />
        <KpiCard label="Leave Taken" value={String(summary.leave)} tone={summary.leave > 0 ? "warning" : "default"} icon="clock" hint="Approved time off" />
        <KpiCard label="Half Days" value={String(summary.half_day)} icon="chart" hint="Half shift completed" />
      </div>

      <Panel title="Shift History" description="Chronological attendance check-in records">
        {records.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No attendance records logged yet.
          </div>
        ) : (
          <DataTable headers={["Shift Date", "Status", "Remarks / Notes"]}>
            {records.map((r) => {
              const approval = (r as Record<string, any>).approvalStatus;
              return (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <Td className="font-medium text-slate-800">{formatDate(r.date)}</Td>
                  <Td>
                    {approval === "pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                        Pending Approval ({r.status.toUpperCase()})
                      </span>
                    ) : approval === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-bold text-rose-700">
                        Rejected (Absent)
                      </span>
                    ) : (
                      <StatusBadge value={r.status} />
                    )}
                  </Td>
                  <Td className="text-slate-500">{r.note || "—"}</Td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
