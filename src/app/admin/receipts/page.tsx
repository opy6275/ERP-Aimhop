import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, Td } from "@/components/ui/data-table";
import { ReceiptModal } from "@/components/admin/receipt-modal";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr } from "@/lib/format";
import { Plus, Receipt } from "@/components/ui/icons";

export default async function ReceiptsPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const receipts = await prisma.paymentReceipt.findMany({
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <AppShell title="Payment Receipts" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Official Disbursement Receipts"
        description="Immutable digital receipts with sequence-tracked PAY-YYYY-##### identifiers."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Operations", href: "/admin/payments" },
          { label: "Receipts" },
        ]}
        actions={[
          {
            label: "Record payment",
            href: "/admin/payments/new",
            icon: <Plus size={16} />,
            variant: "primary",
          },
        ]}
      />

      {receipts.length === 0 ? (
        <EmptyState
          title="No receipts generated"
          description="Receipts are automatically generated when salary payments are processed."
          action={{ label: "Record payment", href: "/admin/payments/new" }}
        />
      ) : (
        <DataTable
          headers={[
            "Receipt No",
            "Employee",
            "Department",
            "Period",
            "Amount Paid",
            "Payment Mode",
            "Issued On",
            "Action",
          ]}
        >
          {receipts.map((r) => {
            const amountNum = decimalToNumber(r.amountPaid);
            const dateStr = formatDate(r.issuedAt);

            return (
              <tr key={r.id} className="transition-colors hover:bg-blue-50/30">
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Receipt size={14} />
                    </div>
                    <span className="font-mono font-bold text-slate-900">{r.receiptNumber}</span>
                  </div>
                </Td>
                <Td>
                  <p className="font-semibold text-slate-900">{r.employeeName}</p>
                  <p className="font-mono text-xs text-slate-400">{r.staffCode}</p>
                </Td>
                <Td>
                  <span className="inline-flex rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                    {r.departmentName}
                  </span>
                </Td>
                <Td className="text-slate-700 font-medium">{r.periodLabel}</Td>
                <Td mono className="font-semibold text-slate-900">
                  {formatInr(amountNum)}
                </Td>
                <Td>
                  <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                    {r.paymentMethod.replace("_", " ")}
                  </span>
                </Td>
                <Td className="text-xs text-slate-500">{dateStr}</Td>
                <Td>
                  <ReceiptModal
                    receipt={{
                      id: r.id,
                      receiptNumber: r.receiptNumber,
                      companyName: r.companyName,
                      employeeName: r.employeeName,
                      staffCode: r.staffCode,
                      departmentName: r.departmentName,
                      periodLabel: r.periodLabel,
                      amountPaid: amountNum,
                      paymentMethod: r.paymentMethod,
                      authorizedBy: r.authorizedBy,
                      issuedAt: dateStr,
                    }}
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
