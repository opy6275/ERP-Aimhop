import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr, formatMonthLabel, toDateOnlyUtc } from "@/lib/format";
import { computePeriodBalance } from "@/lib/domain";
import { StaffCheckinCard } from "@/components/staff/staff-checkin-card";

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

  const [todayAttendance, monthPayments, recentAttendance, recentPayments] = staffId
    ? await Promise.all([
        prisma.attendanceRecord.findUnique({
          where: { staffId_date: { staffId, date: today } },
        }),
        prisma.payment.findMany({
          where: { staffId, periodMonth },
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
      ])
    : [null, [], [], []];

  const salary = staff ? decimalToNumber(staff.salaryAmount) : 0;
  const balance = staff ? computePeriodBalance(salary, monthPayments) : { paid: 0, pending: 0 };

  return (
    <AppShell title="My Dashboard" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title={`Welcome back, ${staff?.fullName || "Employee"}`}
        description={
          staff
            ? `${staff.staffCode} · ${staff.designation || "Staff"} · ${staff.department.name} (${staff.category.name})`
            : "Employee self-service dashboard"
        }
      />

      {staff && (
        <StaffCheckinCard
          todayStatus={todayAttendance?.status || null}
          todayNote={todayAttendance?.note || null}
          employeeName={staff.fullName}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Attendance"
          value={todayAttendance ? todayAttendance.status.toUpperCase().replace("_", " ") : "Not Marked"}
          tone={todayAttendance?.status === "present" ? "success" : todayAttendance?.status === "leave" ? "warning" : "default"}
        />
        <KpiCard label="Monthly Salary" value={formatInr(salary)} />
        <KpiCard label="Paid This Month" value={formatInr(balance.paid)} tone="success" />
        <KpiCard label="Pending Balance" value={formatInr(balance.pending)} tone={balance.pending > 0 ? "warning" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent Attendance"
          action={
            <Link href="/app/attendance" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
              View all
            </Link>
          }
        >
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No attendance records found.</p>
          ) : (
            <ul className="space-y-3">
              {recentAttendance.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{formatDate(a.date)}</span>
                  <StatusBadge value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent Payments"
          action={
            <Link href="/app/payments" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
              View all
            </Link>
          }
        >
          {recentPayments.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No payment history found.</p>
          ) : (
            <DataTable headers={["Date", "Period", "Amount", "Method", "Receipt"]}>
              {recentPayments.map((p) => (
                <tr key={p.id}>
                  <Td>{formatDate(p.paymentDate)}</Td>
                  <Td>{formatMonthLabel(p.periodMonth)}</Td>
                  <Td mono>{formatInr(decimalToNumber(p.amount))}</Td>
                  <Td className="capitalize">{p.paymentMethod.replace("_", " ")}</Td>
                  <Td>
                    {p.receipt ? (
                      <Link href="/app/receipts" className="text-xs text-[var(--color-primary)] hover:underline">
                        {p.receipt.receiptNumber}
                      </Link>
                    ) : (
                      "—"
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
