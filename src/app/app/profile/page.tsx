import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatDateWithAge, formatInr } from "@/lib/format";
import { maskAccountNumber } from "@/lib/security";
import { StaffDocumentsSection } from "@/components/staff/staff-documents-section";

export default async function StaffProfilePage() {
  const { session, user, roleLabel } = await requirePageSession({ staffOnly: true });

  const staff = user?.staffId
    ? await prisma.staff.findUnique({
        where: { id: user.staffId },
        include: { department: true, category: true },
      })
    : null;

  const initials = staff
    ? staff.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM";

  return (
    <AppShell title="My Profile" email={session.email} roleLabel={roleLabel} variant="staff">
      <PageHeader
        title="Employee Profile"
        description="Official employment record, organizational placement, and banking details."
        breadcrumbs={[
          { label: "Staff Portal", href: "/app/dashboard" },
          { label: "Profile" },
        ]}
      />

      {!staff ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No linked employee profile found for this account. Contact your CRM Administrator.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xl font-bold text-white shadow-md shadow-emerald-500/20">
                  {initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{staff.fullName}</h2>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {staff.staffCode}
                    </span>
                    <StatusBadge value={staff.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800">{staff.designation || "Staff Member"}</span>
                    <span>•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {staff.department.name}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {staff.category.name}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Designated Salary"
              value={formatInr(decimalToNumber(staff.salaryAmount))}
              hint={staff.paymentType === "monthly" ? "Monthly Schedule" : "Daily Scheme"}
              icon="currency"
            />
            <KpiCard
              label="Assigned Department"
              value={staff.department.name}
              hint={staff.category.name}
              icon="building"
            />
            <KpiCard
              label="Tenure Since"
              value={formatDate(staff.joiningDate)}
              hint="Official onboarding"
              icon="calendar"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Personal Information"
              description="Identity and contact records on file"
              icon={
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Mobile Phone</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{staff.mobile || "—"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Registered Email</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block truncate">{staff.email || "—"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Gender</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block capitalize">{staff.gender || "—"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Date of Birth</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{formatDateWithAge(staff.dateOfBirth)}</span>
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Address</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{staff.address || "—"}</span>
                </div>
              </div>
            </Panel>

            <Panel
              title="Disbursement Credentials"
              description="Bank account and payout details"
              icon={
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Bank Name</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{staff.bankName || "—"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Account Number</span>
                  <span className="font-mono font-semibold text-slate-900 mt-0.5 block">{maskAccountNumber(staff.accountNumber)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">IFSC Code</span>
                  <span className="font-mono font-semibold text-slate-900 mt-0.5 block">{staff.ifsc || "—"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">UPI Virtual ID</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{staff.upiId || "—"}</span>
                </div>
              </div>
            </Panel>

            {/* KYC & Verified Documents Vault */}
            <StaffDocumentsSection staffId={staff.id} canUpload={true} canDelete={false} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
