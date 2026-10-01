import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryActions } from "@/components/admin/category-actions";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { Tags } from "@/components/ui/icons";

export default async function CategoriesPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const categories = await prisma.staffCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { staff: true } } },
  });

  return (
    <AppShell title="Employment Categories" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Staff Employment Categories"
        description="Classify staff by employment status (Permanent, Contractual, Internship, Daily Engagement)."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Workforce", href: "/admin/staff" },
          { label: "Categories" },
        ]}
      />

      <div className="mb-6">
        <CategoryForm />
      </div>

      {categories.length === 0 ? (
        <EmptyState title="No categories found" description="Create permanent, contract, or intern categories." />
      ) : (
        <DataTable headers={["Category Classification", "Description / Policy", "Assigned Staff", "Policy Status", "Actions"]}>
          {categories.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-blue-50/30">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                    <Tags size={16} />
                  </div>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                </div>
              </Td>
              <Td className="text-slate-600">{c.description || "—"}</Td>
              <Td mono className="font-semibold text-slate-900">
                {c._count.staff} members
              </Td>
              <Td>
                <StatusBadge value={c.status} />
              </Td>
              <Td>
                <CategoryActions
                  category={{
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    status: c.status,
                    staffCount: c._count.staff,
                  }}
                />
              </Td>
            </tr>
          ))}
        </DataTable>
      )}
    </AppShell>
  );
}
