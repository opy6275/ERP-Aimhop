import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentForm } from "@/components/admin/payment-form";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export default async function NewPaymentPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const staff = await prisma.staff.findMany({
    where: { status: "active" },
    orderBy: { fullName: "asc" },
  });

  return (
    <AppShell title="Record Payment" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Record Salary / Advance Payment"
        description="Disburse employee compensation with automatic receipt generation and audit logging."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Payments", href: "/admin/payments" },
          { label: "New Transaction" },
        ]}
        actions={[{ label: "Back to Payments", href: "/admin/payments", variant: "secondary" }]}
      />

      <PaymentForm
        staff={staff.map((s) => ({
          id: s.id,
          staffCode: s.staffCode,
          fullName: s.fullName,
          salaryAmount: decimalToNumber(s.salaryAmount),
        }))}
      />
    </AppShell>
  );
}
