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
        <>
          {/* Mobile Card List (< md) */}
          <div className="space-y-3 md:hidden">
            {receipts.map((r) => {
              const amountNum = decimalToNumber(r.amountPaid);
              const dateStr = formatDate(r.issuedAt);

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                        <Receipt size={16} />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-900 block">{r.receiptNumber}</span>
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                      </div>
                    </div>
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
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Employee</span>
                      <span className="font-semibold text-slate-800 truncate block">{r.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.staffCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Amount Paid</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{formatInr(amountNum)}</span>
                      <span className="text-[10px] text-slate-500 capitalize block">{r.paymentMethod.replace("_", " ")}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="truncate">{r.departmentName}</span>
                    <span className="font-medium text-slate-700">{r.periodLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Data Table (>= md) */}
          <div className="hidden md:block">
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
          </div>
        </>
      )}
    </AppShell>
  );
}
