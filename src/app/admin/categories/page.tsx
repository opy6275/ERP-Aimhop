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
        description="Classify staff agreements, contract tiers, and employment policies."
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
        <>
          {/* Mobile Card List (< md) */}
          <div className="space-y-3 md:hidden">
            {categories.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                      <Tags size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{c.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {c.description || "No policy details provided"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <CategoryActions
                      category={{
                        id: c.id,
                        name: c.name,
                        description: c.description,
                        status: c.status,
                        staffCount: c._count.staff,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 bg-indigo-50/80 text-indigo-800 px-2.5 py-0.5 rounded-md border border-indigo-100/60 text-xs">
                    {c._count.staff} assigned staff
                  </span>
                  <StatusBadge value={c.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Data Table (>= md) */}
          <div className="hidden md:block">
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
          </div>
        </>
      )}
    </AppShell>
  );
}
