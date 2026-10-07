import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { DataTable, Td } from "@/components/ui/data-table";
import { ReceiptModal } from "@/components/admin/receipt-modal";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatInr } from "@/lib/format";

export default async function StaffReceiptsPage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staffId = user?.staffId;
  const receipts = staffId
    ? await prisma.paymentReceipt.findMany({
        where: { payment: { staffId } },
        orderBy: { issuedAt: "desc" },
        take: 50,
        include: {
          payment: {
            include: {
              staff: {
                include: { department: true },
              },
            },
          },
        },
      })
    : [];

  return (
    <AppShell title="My Receipts" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title="Payment Receipts"
        description="Official computer-generated salary and disbursement receipts for your records."
        breadcrumbs={[
          { label: "Staff Portal", href: "/app/dashboard" },
          { label: "Receipts" },
        ]}
      />

      <Panel title="Issued Salary Receipts">
        {receipts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No disbursement receipts generated yet.
          </div>
        ) : (
          <DataTable headers={["Receipt No", "Period", "Amount Paid", "Mode", "Issued Date", "Receipt"]}>
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                <Td className="font-mono font-semibold text-blue-700">{r.receiptNumber}</Td>
                <Td className="font-medium text-slate-800">{r.periodLabel}</Td>
                <Td mono className="font-bold text-slate-900">{formatInr(decimalToNumber(r.amountPaid))}</Td>
                <Td>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-slate-100 text-slate-700">
                    {r.paymentMethod.replace("_", " ")}
                  </span>
                </Td>
                <Td className="text-slate-600">{formatDate(r.issuedAt)}</Td>
                <Td>
                  <ReceiptModal
                    receipt={{
                      id: r.id,
                      receiptNumber: r.receiptNumber,
                      companyName: "AimHop ERP",
                      employeeName: r.payment.staff.fullName,
                      staffCode: r.payment.staff.staffCode,
                      departmentName: r.payment.staff.department.name,
                      periodLabel: r.periodLabel,
                      amountPaid: decimalToNumber(r.amountPaid),
                      paymentMethod: r.paymentMethod,
                      authorizedBy: r.authorizedBy,
                      issuedAt: formatDate(r.issuedAt),
                    }}
                  />
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
