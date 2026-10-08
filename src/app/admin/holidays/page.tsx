import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Sparkles, CalendarDays, Plus, Trash2, Calendar } from "@/components/ui/icons";
import { HolidaysClient } from "@/components/admin/holidays-client";

export default async function HolidaysPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  const holidays = await prisma.companyHoliday.findMany({
    orderBy: { date: "asc" },
  });

  const today = new Date();
  const upcoming = holidays.filter((h) => new Date(h.date) >= today);
  const nextHoliday = upcoming[0] || null;

  const totalHolidays = holidays.length;
  const nationalCount = holidays.filter((h) => h.type === "national").length;
  const festivalCount = holidays.filter((h) => h.type === "festival").length;

  return (
    <AppShell title="Company Holidays" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Official Holiday Calendar"
        description="Configure gazetted and cultural holidays. Recognized as paid company holidays on attendance rosters."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Operations" },
          { label: "Holidays" },
        ]}
      />

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Holidays"
          value={String(totalHolidays)}
          tone="primary"
          icon={<Sparkles size={18} />}
          hint="Calendar year entitlement"
        />
        <KpiCard
          label="Next Upcoming Holiday"
          value={nextHoliday ? nextHoliday.name : "None scheduled"}
          tone="success"
          icon={<CalendarDays size={18} />}
          hint={nextHoliday ? formatDate(new Date(nextHoliday.date)) : "All completed"}
        />
        <KpiCard
          label="National Holidays"
          value={String(nationalCount)}
          tone="default"
          icon={<Calendar size={18} />}
          hint="Mandatory Gazetted days"
        />
        <KpiCard
          label="Festival Observances"
          value={String(festivalCount)}
          tone="warning"
          icon={<Sparkles size={18} />}
          hint="Cultural & seasonal events"
        />
      </div>

      <HolidaysClient
        initialHolidays={holidays.map((h) => ({
          id: h.id,
          name: h.name,
          dateStr: h.date.toISOString().slice(0, 10),
          type: h.type,
          description: h.description,
        }))}
      />
    </AppShell>
  );
}
