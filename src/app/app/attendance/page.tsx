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
    if (r.status in summary) {
      summary[r.status as keyof typeof summary]++;
    }
  }

  return (
    <AppShell title="My Attendance" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title="Attendance & Shift Records"
        description="Review your monthly presence, approved leaves, and attendance logs."
        breadcrumbs={[
          { label: "Staff Portal", href: "/app/dashboard" },
          { label: "Attendance" },
        ]}
        actionNode={<StaffMonthlySheetModal initialStaff={staff || undefined} />}
      />

      {staff && (
        <StaffCheckinCard
          todayStatus={todayAttendance?.status || null}
          todayNote={todayAttendance?.note || null}
          employeeName={staff.fullName}
        />
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Present Days" value={String(summary.present)} tone="success" icon="calendar" hint="Logged presence" />
        <KpiCard label="Absent Days" value={String(summary.absent)} tone={summary.absent > 0 ? "danger" : "default"} icon="users" hint="Unexcused shifts" />
        <KpiCard label="Leave Taken" value={String(summary.leave)} tone={summary.leave > 0 ? "warning" : "default"} icon="clock" hint="Approved time off" />
        <KpiCard label="Half Days" value={String(summary.half_day)} icon="chart" hint="Half shift completed" />
      </div>

      <Panel title="Attendance Log History" description="Chronological shift check-ins">
        {records.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No attendance records logged yet.
          </div>
        ) : (
          <DataTable headers={["Shift Date", "Status", "Remarks / Notes"]}>
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                <Td className="font-medium text-slate-800">{formatDate(r.date)}</Td>
                <Td>
                  <StatusBadge value={r.status} />
                </Td>
                <Td className="text-slate-500">{r.note || "—"}</Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
