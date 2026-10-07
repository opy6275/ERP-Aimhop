import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, Td } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import type { PaymentMethod, PaymentKind } from "@prisma/client";
import { computePeriodBalance } from "@/lib/domain";
import { decimalToNumber, formatDate, formatInr, formatMonthLabel } from "@/lib/format";
import {
  CreditCard,
  Plus,
  Clock,
  Receipt as ReceiptIcon,
  Users,
  Search,
  Filter,
} from "@/components/ui/icons";
import { PaymentRowActions } from "@/components/admin/payment-row-actions";

type PaymentRecord = {
  id: string;
  paymentDate: Date;
  periodMonth: Date;
  amount: string | number | { toString(): string };
  paymentMethod: string;
  paymentKind: string;
  emailSentAt?: Date | null;
  emailSentTo?: string | null;
  staff: {
    id: string;
    fullName: string;
    staffCode: string;
    department: { name: string };
  };
  receipt: { id: string; receiptNumber: string } | null;
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; method?: string; kind?: string }>;
}) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const sp = await searchParams;
  const q = sp.q?.trim().toLowerCase() ?? "";
  const method = sp.method || undefined;
  const kind = sp.kind || undefined;

  const now = new Date();
  const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [payments, activeStaff, monthPayments] = await Promise.all([
    prisma.payment.findMany({
      where: {
        ...(method ? { paymentMethod: method as PaymentMethod } : {}),
        ...(kind ? { paymentKind: kind as PaymentKind } : {}),
        ...(q
          ? {
              staff: {
                OR: [
                  { fullName: { contains: q } },
                  { staffCode: { contains: q } },
                ],
              },
            }
          : {}),
      },
      orderBy: { paymentDate: "desc" },
      take: 100,
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            staffCode: true,
            department: { select: { name: true } },
          },
        },
        receipt: { select: { id: true, receiptNumber: true } },
      },
    }),
    prisma.staff.findMany({ where: { status: "active" }, select: { id: true, salaryAmount: true } }),
    prisma.payment.findMany({
      where: { periodMonth },
      select: { amount: true, paymentKind: true, staffId: true },
    }),
  ]);

  const monthPaid = monthPayments
    .filter((p) => p.paymentKind !== "deduction")
    .reduce((s, p) => s + decimalToNumber(p.amount), 0);

  let pending = 0;
  for (const s of activeStaff) {
    const bal = computePeriodBalance(
      decimalToNumber(s.salaryAmount),
      monthPayments.filter((p) => p.staffId === s.id),
    );
    pending += bal.pending;
  }

  return (
    <AppShell title="Payment Management" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Payroll & Disbursements"
        description="Track salary disbursements, advance settlements, and official payment receipts."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Operations", href: "/admin/payments" },
          { label: "Payments" },
        ]}
        actions={[
          {
            label: "Record Payment",
            href: "/admin/payments/new",
            icon: <Plus size={16} />,
            variant: "primary",
          },
          {
            label: "Receipts Ledger",
            href: "/admin/receipts",
            icon: <ReceiptIcon size={16} />,
            variant: "secondary",
          },
        ]}
      />

      {/* KPI Cards Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="This Month Paid"
          value={formatInr(monthPaid)}
          tone="primary"
          icon={<CreditCard size={18} />}
          hint={`${formatMonthLabel(periodMonth)} total disbursements`}
        />
        <KpiCard
          label="Pending Payroll"
          value={formatInr(pending)}
          tone={pending > 0 ? "warning" : "default"}
          icon={<Clock size={18} />}
          hint="Remaining balance for active employees"
        />
        <KpiCard
          label="Transactions"
          value={String(payments.length)}
          tone="default"
          icon={<ReceiptIcon size={18} />}
          hint="Recorded payment transactions"
        />
        <KpiCard
          label="Active Workforce"
          value={String(activeStaff.length)}
          tone="success"
          icon={<Users size={18} />}
          hint="Employees eligible for compensation"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by employee name or staff ID..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9.5 pr-4 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              name="kind"
              defaultValue={kind ?? ""}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Payment Types</option>
              <option value="salary">Salary</option>
              <option value="partial">Partial</option>
              <option value="advance">Advance</option>
              <option value="deduction">Deduction</option>
              <option value="adjustment">Adjustment</option>
            </select>

            <select
              name="method"
              defaultValue={method ?? ""}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Payment Modes</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
            >
              <Filter size={14} />
              <span>Filter</span>
            </button>

            {(q || method || kind) && (
              <Link
                href="/admin/payments"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Main Table */}
      {payments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description={
            q || method || kind
              ? "No transactions match your active filters. Try adjusting your search query."
              : "Record the first employee disbursement to generate salary slips and receipts."
          }
          action={{ label: "Record payment", href: "/admin/payments/new" }}
        />
      ) : (
        <DataTable
          headers={[
            "Date",
            "Employee",
            "Period Month",
            "Amount Paid",
            "Payment Mode",
            "Classification",
            "Receipt Slip",
            "Action",
          ]}
        >
          {(payments as PaymentRecord[]).map((p) => {
            const initials = p.staff.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);

            const methodPills: Record<string, string> = {
              bank_transfer: "bg-blue-50 text-blue-700 border-blue-200/80",
              upi: "bg-purple-50 text-purple-700 border-purple-200/80",
              cash: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
              other: "bg-slate-50 text-slate-700 border-slate-200",
            };

            const kindPills: Record<string, string> = {
              salary: "bg-emerald-50 text-emerald-800 font-semibold",
              partial: "bg-amber-50 text-amber-800",
              advance: "bg-indigo-50 text-indigo-800",
              deduction: "bg-rose-50 text-rose-800",
              adjustment: "bg-slate-100 text-slate-800",
            };

            return (
              <tr key={p.id} className="transition-colors hover:bg-blue-50/30">
                <Td className="text-slate-600 font-medium">
                  {formatDate(p.paymentDate)}
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-mono text-xs font-bold text-blue-800">
                      {initials}
                    </div>
                    <div>
                      <Link
                        href={`/admin/staff/${p.staff.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition"
                      >
                        {p.staff.fullName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {p.staff.staffCode} · {p.staff.department.name}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-700 font-medium">
                  {formatMonthLabel(p.periodMonth)}
                </Td>
                <Td mono className="font-semibold text-slate-900">
                  {formatInr(decimalToNumber(p.amount))}
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium capitalize ${
                      methodPills[p.paymentMethod] ?? "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {p.paymentMethod.replace("_", " ")}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      kindPills[p.paymentKind] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.paymentKind}
                  </span>
                </Td>
                <Td>
                  {p.receipt ? (
                    <Link
                      href="/admin/receipts"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/60 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:border-blue-300"
                    >
                      <ReceiptIcon size={12} />
                      <span>{p.receipt.receiptNumber}</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </Td>
                <Td>
                  <PaymentRowActions
                    paymentId={p.id}
                    amountFormatted={formatInr(decimalToNumber(p.amount))}
                    employeeName={p.staff.fullName}
                    emailSentAt={p.emailSentAt ? formatDate(p.emailSentAt) : null}
                    emailSentTo={p.emailSentTo || null}
                    receipt={
                      p.receipt
                        ? {
                            id: p.receipt.id,
                            receiptNumber: p.receipt.receiptNumber,
                            companyName: "AimHop ERP",
                            employeeName: p.staff.fullName,
                            staffCode: p.staff.staffCode,
                            departmentName: p.staff.department.name,
                            periodLabel: formatMonthLabel(p.periodMonth),
                            amountPaid: decimalToNumber(p.amount),
                            paymentMethod: p.paymentMethod,
                            authorizedBy: "Accounts Department",
                            issuedAt: formatDate(p.paymentDate),
                          }
                        : null
                    }
                  />
                </Td>

              </tr>
            );
          })}
        </DataTable>
      )}
    </AppShell>
  );
}
