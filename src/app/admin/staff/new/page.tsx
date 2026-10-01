import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StaffForm } from "@/components/admin/staff-form";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";

export default async function NewStaffPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const [departments, categories] = await Promise.all([
    prisma.department.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
    prisma.staffCategory.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell title="Onboard New Staff" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Onboard New Employee"
        description="Register employee profile, department allocation, designation, and compensation scheme."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Staff Directory", href: "/admin/staff" },
          { label: "New Employee" },
        ]}
        actions={[{ label: "Back to Directory", href: "/admin/staff", variant: "secondary" }]}
      />

      <StaffForm
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </AppShell>
  );
}
