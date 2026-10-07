import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Td } from "@/components/ui/data-table";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr, formatMonthLabel } from "@/lib/format";
import { computePeriodBalance } from "@/lib/domain";

export default async function StaffPaymentsPage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staffId = user?.staffId;
  const staff = staffId
    ? await prisma.staff.findUnique({
        where: { id: staffId },
        select: { salaryAmount: true },
      })
    : null;

  const salary = staff ? decimalToNumber(staff.salaryAmount) : 0;
  const now = new Date();
  const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [allPayments, currentMonthPayments] = staffId
    ? await Promise.all([
        prisma.payment.findMany({
          where: { staffId },
          orderBy: { paymentDate: "desc" },
          take: 50,
          include: { receipt: true },
        }),
        prisma.payment.findMany({
          where: { staffId, periodMonth },
        }),
      ])
    : [[], []];

  const balance = computePeriodBalance(salary, currentMonthPayments);

  return (
    <AppShell title="My Payments" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title="Payments & Slips"
        description="Review salary settlements, disbursement records, and payment receipts."
        breadcrumbs={[
          { label: "Staff Portal", href: "/app/dashboard" },
          { label: "Payments" },
        ]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Designated Salary"
          value={formatInr(salary)}
          hint="Baseline monthly compensation"
          icon="currency"
        />
        <KpiCard
          label="Disbursed This Month"
          value={formatInr(balance.paid)}
          hint="Current payroll period"
          tone="success"
          icon="wallet"
        />
        <KpiCard
          label="Pending Balance"
          value={formatInr(balance.pending)}
          hint={balance.pending > 0 ? "Pending disbursement" : "Settled in full"}
          tone={balance.pending > 0 ? "warning" : "default"}
          icon="chart"
        />
      </div>

      <Panel title="Disbursement Records" description="Official payment transactions logged for your account">
        {allPayments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No payment transactions recorded yet.
          </div>
        ) : (
          <DataTable headers={["Payment Date", "Period", "Amount Paid", "Method", "Type", "Receipt"]}>
            {allPayments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <Td className="text-slate-600">{formatDate(p.paymentDate)}</Td>
                <Td className="font-medium text-slate-800">{formatMonthLabel(p.periodMonth)}</Td>
                <Td mono className="font-bold text-slate-900">{formatInr(decimalToNumber(p.amount))}</Td>
                <Td className="capitalize">{p.paymentMethod.replace("_", " ")}</Td>
                <Td>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-slate-100 text-slate-700">
                    {p.paymentKind}
                  </span>
                </Td>
                <Td>
                  {p.receipt ? (
                    <Link
                      href="/app/receipts"
                      className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {p.receipt.receiptNumber}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
