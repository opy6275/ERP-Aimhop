import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { AttendanceMark } from "@/components/admin/attendance-mark";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate, toDateOnlyUtc } from "@/lib/format";
import { CalendarCheck, History } from "@/components/ui/icons";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const sp = await searchParams;
  const dateStr = sp.date || new Date().toISOString().slice(0, 10);
  const day = toDateOnlyUtc(dateStr);

  const [staff, existing, history] = await Promise.all([
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
  ]);

  const byStaff = Object.fromEntries(existing.map((r) => [r.staffId, r.status]));

  return (
    <AppShell title="Attendance Roster" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Workforce Attendance"
        description="Mark and audit daily attendance across all enrolled active team members."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Operations", href: "/admin/attendance" },
          { label: "Attendance" },
        ]}
      />

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

      <div className="mt-8">
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
    </AppShell>
  );
}
