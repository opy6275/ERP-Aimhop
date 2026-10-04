import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsTabsView } from "@/components/admin/settings-tabs-view";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { getSmtpSettings } from "@/lib/email";

export default async function SettingsPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const [company, smtp] = await Promise.all([
    prisma.company.findFirst(),
    getSmtpSettings(),
  ]);

  return (
    <AppShell title="Settings & Preferences" email={session.email} roleLabel={roleLabel} variant="admin">
      <div className="mb-6">
        <PageHeader
          title="Organization Settings"
          description="Manage company details, administrator credentials, and automated email SMTP delivery."
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Settings" },
          ]}
        />
      </div>

      <SettingsTabsView
        adminEmail={session.email}
        initialCompany={
          company
            ? {
                name: company.name,
                legalName: company.legalName ?? null,
                currency: company.currency,
                timezone: company.timezone,
                receiptFooter: company.receiptFooter ?? null,
              }
            : null
        }
        initialSmtp={{
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          user: smtp.user,
          hasPassword: Boolean(smtp.pass && smtp.pass.length > 0),
          fromEmail: smtp.fromEmail,
          fromName: smtp.fromName,
          replyTo: smtp.replyTo ?? null,
          isEnabled: smtp.isEnabled,
        }}
      />
    </AppShell>
  );
}
