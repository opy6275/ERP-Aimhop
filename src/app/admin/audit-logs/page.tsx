import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, Td } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function AuditLogsPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { email: true } } },
  });

  const totalLogs = logs.length;
  const uniqueActors = new Set(logs.map((l) => l.actor?.email).filter(Boolean)).size;
  const paymentActions = logs.filter((l) => l.action.toLowerCase().includes("payment")).length;
  const attendanceActions = logs.filter((l) => l.action.toLowerCase().includes("attendance")).length;

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("payment")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (act.includes("attendance")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (act.includes("staff")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (act.includes("login") || act.includes("auth")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <AppShell title="Activity Logs" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="System Activity & Audit Trail"
        description="Immutable compliance journal recording administrative actions, ledger modifications, and logins."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Audit Logs" },
        ]}
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          label="Recent Audit Records"
          value={totalLogs}
          hint="Latest stream"
          icon="activity"
        />
        <KpiCard
          label="Active Operators"
          value={uniqueActors}
          hint="Unique administrators"
          icon="users"
        />
        <KpiCard
          label="Payment Events"
          value={paymentActions}
          hint="Disbursements & receipts"
          tone="accent"
          icon="wallet"
        />
        <KpiCard
          label="Attendance Entries"
          value={attendanceActions}
          hint="Daily shifts recorded"
          icon="calendar"
        />
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No activity recorded yet"
          description="Create staff members, mark shift attendance, or issue payments to populate the audit journal."
        />
      ) : (
        <DataTable headers={["Timestamp", "Operator / Actor", "Operation Executed", "Target Entity / Reference"]}>
          {logs.map((l) => {
            const timeStr = l.createdAt.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "Asia/Kolkata",
            });

            return (
              <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                <Td>
                  <div>
                    <span className="font-medium text-slate-800 block">{formatDate(l.createdAt)}</span>
                    <span className="font-mono text-xs text-slate-400">{timeStr} IST</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-medium text-slate-800">{l.actor?.email ?? "system_automated"}</span>
                  </div>
                </Td>
                <Td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionBadge(l.action)}`}>
                    {l.action}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{l.targetLabel || l.entityType || "—"}</span>
                    {l.entityId && (
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{l.entityId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </AppShell>
  );
}
