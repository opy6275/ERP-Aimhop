import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StaffEditForm } from "@/components/admin/staff-edit-form";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const { id } = await params;

  const [staff, departments, categories] = await Promise.all([
    prisma.staff.findUnique({ where: { id } }),
    prisma.department.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
    prisma.staffCategory.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
  ]);
  if (!staff) notFound();

  return (
    <AppShell title={`Edit ${staff.fullName}`} email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title={`Edit Staff Profile — ${staff.fullName}`}
        description={`Update employment status, department classification, salary amount, or banking parameters for ${staff.staffCode}.`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Staff Directory", href: "/admin/staff" },
          { label: staff.fullName, href: `/admin/staff/${staff.id}` },
          { label: "Edit Record" },
        ]}
        actions={[{ label: "View Profile", href: `/admin/staff/${staff.id}`, variant: "secondary" }]}
      />

      <StaffEditForm
        staff={{
          id: staff.id,
          staffCode: staff.staffCode,
          fullName: staff.fullName,
          mobile: staff.mobile,
          email: staff.email,
          gender: staff.gender,
          dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.toISOString() : null,
          address: staff.address,
          departmentId: staff.departmentId,
          categoryId: staff.categoryId,
          designation: staff.designation,
          joiningDate: staff.joiningDate ? staff.joiningDate.toISOString() : null,
          employmentType: staff.employmentType,
          status: staff.status,
          salaryAmount: decimalToNumber(staff.salaryAmount),
          paymentType: staff.paymentType,
          bankName: staff.bankName,
          accountNumber: staff.accountNumber,
          ifsc: staff.ifsc,
          upiId: staff.upiId,
        }}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </AppShell>
  );
}
