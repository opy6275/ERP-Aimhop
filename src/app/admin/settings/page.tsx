import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const company = await prisma.company.findFirst();

  return (
    <AppShell title="Settings & Preferences" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title="Organization Settings"
        description="Configure enterprise branding, currency conventions, receipt header details, and system preferences."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Profile Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Panel
            title="Enterprise Profile & Branding"
            description="Official corporate credentials printed on receipts and statements"
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          >
            <CompanySettingsForm
              initialCompany={
                company
                  ? {
                      name: company.name,
                      legalName: company.legalName,
                      currency: company.currency,
                      timezone: company.timezone,
                      receiptFooter: company.receiptFooter,
                    }
                  : null
              }
            />
          </Panel>

          {/* Payroll Rules */}
          <Panel
            title="Payroll & Accounting Rules"
            description="Default calculation policies for compensation and shift allowances"
            icon={
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">Standard Monthly Payroll Cycle</p>
                  <p className="text-xs text-slate-500">Calculated on calendar month basis (1st to end-of-month)</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Standard 30 Days
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">Automatic Receipt Numbering</p>
                  <p className="text-xs text-slate-500">Sequential receipt formatting with year prefix (e.g. PAY-2026-00001)</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Enabled
                </span>
              </div>
            </div>
          </Panel>
        </div>

        {/* System & Architecture Info (1 col) */}
        <div className="space-y-6">
          <Panel
            title="System Architecture"
            description="Runtime environment specification"
            icon={
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Framework</span>
                <span className="font-semibold text-slate-800">Next.js 15.5 (App Router)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Database Layer</span>
                <span className="font-semibold text-slate-800">Prisma ORM (SQLite Engine)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Session Security</span>
                <span className="font-semibold text-slate-800">HMAC-SHA256 Signed Cookie</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Access Control</span>
                <span className="font-semibold text-emerald-600">RBAC Enforced (Admin / Staff)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Deployment Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live & Healthy
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
