import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { getAllLeaveRequests } from "@/lib/leaves";
import { prisma } from "@/lib/prisma";
import { toDateOnlyUtc } from "@/lib/format";
import { CalendarDays, Clock, CheckCircle2, XCircle } from "@/components/ui/icons";
import { AdminLeavesClient } from "@/components/admin/admin-leaves-client";

export default async function AdminLeavesPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  const today = toDateOnlyUtc(new Date());

  const [leaves, departments, onLeaveToday] = await Promise.all([
    getAllLeaveRequests(),
    prisma.department.findMany({
      where: { status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendanceRecord.count({
      where: { date: today, status: "leave" },
    }),
  ]);

  const summary = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <AppShell title="Leave Management" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Leave Management"
        description="Review employee leave applications, approve time off, and maintain attendance synchronization."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Operations" },
          { label: "Leaves" },
        ]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending Approvals"
          value={String(summary.pending)}
          tone={summary.pending > 0 ? "warning" : "default"}
          icon={<Clock size={18} />}
          hint="Requires administrative review"
        />
        <KpiCard
          label="Workforce on Leave Today"
          value={String(onLeaveToday)}
          tone={onLeaveToday > 0 ? "primary" : "default"}
          icon={<CalendarDays size={18} />}
          hint="Marked on today's shift register"
        />
        <KpiCard
          label="Total Approved"
          value={String(summary.approved)}
          tone="success"
          icon={<CheckCircle2 size={18} />}
          hint="Excused employee absences"
        />
        <KpiCard
          label="Rejected Applications"
          value={String(summary.rejected)}
          tone={summary.rejected > 0 ? "danger" : "default"}
          icon={<XCircle size={18} />}
          hint="Declined leave requests"
        />
      </div>

      <AdminLeavesClient leaves={leaves} departments={departments} />
    </AppShell>
  );
}
