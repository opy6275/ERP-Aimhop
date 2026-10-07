import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { AttendanceMark } from "@/components/admin/attendance-mark";
import { MonthlyAttendanceManager } from "@/components/admin/monthly-attendance-manager";
import { AttendanceApprovalsPanel } from "@/components/admin/attendance-approvals-panel";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate, toDateOnlyUtc } from "@/lib/format";
import { CalendarCheck, CalendarDays, History, Clock } from "@/components/ui/icons";
import { AdminMusterRollModal } from "@/components/attendance/admin-muster-roll-modal";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; tab?: string }>;
}) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const sp = await searchParams;
  const activeTab = sp.tab === "daily" ? "daily" : sp.tab === "requests" ? "requests" : "monthly";
  const dateStr = sp.date || new Date().toISOString().slice(0, 10);
  const day = toDateOnlyUtc(dateStr);

  const [staff, existing, history, pendingCount] = await Promise.all([
    prisma.staff.findMany({
      where: { status: "active" },
      orderBy: { fullName: "asc" },
      include: { department: { select: { name: true } } },
    }),
    prisma.attendanceRecord.findMany({ where: { date: day } }),
    prisma.attendanceRecord.findMany({
      orderBy: [{ date: "desc" }, { staff: { fullName: "asc" } }],
      take: 30,
      include: {
        staff: { select: { fullName: true, staffCode: true, department: { select: { name: true } } } },
      },
    }),
    prisma.attendanceRecord.count({
      where: { approvalStatus: "pending" },
    }),
  ]);

  const byStaff = Object.fromEntries(existing.map((r) => [r.staffId, r.status]));

  return (
    <AppShell title="Attendance Roster" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Workforce Attendance"
        description="Monitor attendance records, review check-ins, and manage monthly muster sheets."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Operations", href: "/admin/attendance" },
          { label: "Attendance" },
        ]}
        actionNode={<AdminMusterRollModal />}
      />

      {/* Top Navigation View Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <Link
          href="/admin/attendance?tab=monthly"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "monthly"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CalendarDays size={16} />
          <span>Monthly Register</span>
        </Link>

        <Link
          href={`/admin/attendance?tab=requests&date=${dateStr}`}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "requests"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock size={16} />
          <span>Requests & Approvals</span>
          {pendingCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                activeTab === "requests"
                  ? "bg-amber-400 text-slate-900"
                  : "bg-amber-500 text-white animate-pulse"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </Link>

        <Link
          href={`/admin/attendance?tab=daily&date=${dateStr}`}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "daily"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CalendarCheck size={16} />
          <span>Daily Sheet</span>
        </Link>
      </div>

      {activeTab === "requests" ? (
        /* Attendance Requests & Approval Queue */
        <AttendanceApprovalsPanel initialDate={dateStr} />
      ) : activeTab === "monthly" ? (
        /* Monthly Attendance Manager & Staff-wise Breakdown */
        <MonthlyAttendanceManager />
      ) : (
        /* Daily Marking Sheet & Recent Activity Log */
        <div className="space-y-8">
          <Panel
            title="Daily Attendance Sheet"
            subtitle={`Roster for ${dateStr}`}
            icon={<CalendarCheck size={16} />}
          >
            <AttendanceMark
              date={dateStr}
              staff={staff.map((s) => ({
                id: s.id,
                staffCode: s.staffCode,
                fullName: s.fullName,
                department: s.department,
                current: byStaff[s.id],
              }))}
            />
          </Panel>

          <Panel
            title="Attendance Activity Log"
            subtitle="Recent daily presence updates"
            icon={<History size={16} />}
          >
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No attendance history logged yet.</p>
            ) : (
              <DataTable headers={["Date", "Employee", "Department", "Recorded Status"]}>
                {history.map((h) => (
                  <tr key={h.id} className="transition-colors hover:bg-slate-50/60">
                    <Td className="font-medium text-slate-700">{formatDate(h.date)}</Td>
                    <Td>
                      <span className="font-semibold text-slate-900">{h.staff.fullName}</span>
                      <span className="ml-2 font-mono text-xs text-slate-400">{h.staff.staffCode}</span>
                    </Td>
                    <Td>
                      <span className="inline-flex rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        {h.staff.department.name}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge value={h.status} />
                    </Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
