import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { requirePageSession } from "@/lib/require-page-session";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDate, formatDateWithAge, formatInr, formatMonthLabel } from "@/lib/format";
import { StaffCredentialsModal } from "@/components/admin/staff-credentials-modal";
import { StaffDocumentsSection } from "@/components/staff/staff-documents-section";
import {
  Pencil,
  CalendarCheck,
  Plus,
  User,
  Building2,
  Key,
  AlertCircle,
  Calendar,
} from "@/components/ui/icons";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const { id } = await params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          lastLoginAt: true,
        },
      },
      attendance: { orderBy: { date: "desc" }, take: 10 },
      payments: {
        orderBy: { paymentDate: "desc" },
        take: 10,
        include: { receipt: true },
      },
    },
  });
  if (!staff) notFound();

  // Calculate metrics
  const salary = decimalToNumber(staff.salaryAmount);
  const totalPaid = staff.payments.reduce((acc, p) => acc + decimalToNumber(p.amount), 0);
  const presentDays = staff.attendance.filter((a) => a.status === "present").length;
  const latestPayment = staff.payments[0]?.paymentDate ? formatDate(staff.payments[0].paymentDate) : "None";

  // Initials for avatar
  const initials = staff.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell title="Staff Profile" email={session.email} roleLabel={roleLabel} variant="admin">
      <PageHeader
        title={staff.fullName}
        description="Comprehensive employee record, payroll settings, attendance, and disbursement ledger."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Staff Directory", href: "/admin/staff" },
          { label: staff.fullName },
        ]}
        actions={[
          { label: "Staff Directory", href: "/admin/staff", variant: "secondary" },
          { label: "Edit Profile", href: `/admin/staff/${staff.id}/edit`, variant: "secondary" },
          { label: "Record Payment", href: "/admin/payments/new", variant: "primary" },
        ]}
      />

      {/* Staff Profile Header Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-mono text-xl font-bold text-blue-700 border border-blue-200">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {staff.department.name}
                </span>
                <span>•</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {staff.category.name}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <StaffCredentialsModal
              staffId={staff.id}
              staffCode={staff.staffCode}
              staffName={staff.fullName}
              contactEmail={staff.email}
              user={staff.user}
            />
            <Link
              href={`/admin/staff/${staff.id}/edit`}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Pencil size={13} className="text-slate-500" />
              <span>Edit Details</span>
            </Link>
            <Link
              href="/admin/attendance"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <CalendarCheck size={13} className="text-slate-500" />
              <span>Mark Attendance</span>
            </Link>
            <Link
              href="/admin/payments/new"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus size={13} />
              <span>Pay Salary</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          label="Base Compensation"
          value={formatInr(salary)}
          hint={staff.paymentType === "monthly" ? "Per Month" : "Daily Rate"}
          icon="currency"
        />
        <KpiCard
          label="Recent Attendance"
          value={`${presentDays} / ${staff.attendance.length} Days`}
          hint="Last 10 logged dates"
          tone={presentDays > 5 ? "success" : "default"}
          icon="calendar"
        />
        <KpiCard
          label="Total Paid Recorded"
          value={formatInr(totalPaid)}
          hint="From visible disbursements"
          tone="accent"
          icon="wallet"
        />
        <KpiCard
          label="Latest Disbursement"
          value={latestPayment}
          hint="Most recent transaction"
          icon="chart"
        />
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Personal Details */}
        <Panel
          title="Personal & Contact Details"
          description="Direct contact and demographic information"
          icon={<User size={18} className="text-blue-600" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Mobile Phone</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{staff.mobile || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Work / Personal Email</span>
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
              <span className="text-xs font-medium text-slate-500 block">Residential Address</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{staff.address || "—"}</span>
            </div>
          </div>
        </Panel>

        {/* Employment & Banking */}
        <Panel
          title="Employment & Banking Details"
          description="Designation, payroll scheme and bank account parameters"
          icon={<Building2 size={18} className="text-blue-600" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Employment Type</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{staff.employmentType || "Full-time"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Joining Date</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{formatDate(staff.joiningDate)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Bank Name</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{staff.bankName || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">Account Number</span>
              <span className="font-mono font-semibold text-slate-900 mt-0.5 block">{staff.accountNumber || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">IFSC Code</span>
              <span className="font-mono font-semibold text-slate-900 mt-0.5 block">{staff.ifsc || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">UPI Virtual Address</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{staff.upiId || "—"}</span>
            </div>
          </div>
        </Panel>

        {/* Portal Login Credentials Panel */}
        <div className="sm:col-span-2">
          <Panel
            title="Portal Login & Access Credentials"
            description="Manage employee login credentials, password updates, and self-service portal authorization"
            icon={<Key size={18} className="text-blue-600" />}
            action={
              <StaffCredentialsModal
                staffId={staff.id}
                staffCode={staff.staffCode}
                staffName={staff.fullName}
                contactEmail={staff.email}
                user={staff.user}
              />
            }
          >
            {staff.user ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Login Email Address</span>
                  <span className="font-semibold text-slate-900 mt-1 block truncate font-mono text-xs">
                    {staff.user.email}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Portal Status</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${staff.user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${staff.user.isActive ? "text-emerald-700" : "text-rose-700"}`}>
                      {staff.user.isActive ? "Active (Can Login)" : "Access Disabled"}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Access Level</span>
                  <span className="font-semibold text-slate-800 mt-1 block text-xs">
                    Staff Portal (Self-Service)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Last Active Session</span>
                  <span className="font-medium text-slate-700 mt-1 block text-xs">
                    {staff.user.lastLoginAt ? formatDate(staff.user.lastLoginAt) : "Never logged in"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">No Portal Login Configured</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      This employee cannot sign in to view their attendance, salary receipts or leave requests yet.
                    </p>
                  </div>
                </div>

                <StaffCredentialsModal
                  staffId={staff.id}
                  staffCode={staff.staffCode}
                  staffName={staff.fullName}
                  contactEmail={staff.email}
                  user={staff.user}
                />
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Attendance & Payment Ledgers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Attendance */}
        <Panel
          title="Attendance Log"
          description="Recent shift and leave records"
          action={
            <Link
              href="/admin/attendance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors"
            >
              Mark Today
            </Link>
          }
        >
          {staff.attendance.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No attendance records logged for this employee.
            </div>
          ) : (
            <div className="space-y-2.5">
              {staff.attendance.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500">
                      <Calendar size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-800">{formatDate(a.date)}</span>
                  </div>
                  <StatusBadge value={a.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Payment History */}
        <Panel
          title="Disbursement History"
          description="Recorded salary, advance and partial payments"
          action={
            <Link
              href="/admin/payments/new"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors"
            >
              New Payment
            </Link>
          }
        >
          {staff.payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No payments logged for this employee yet.
            </div>
          ) : (
            <DataTable headers={["Date", "Period", "Amount", "Method", "Receipt"]}>
              {staff.payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <Td className="text-slate-600">{formatDate(p.paymentDate)}</Td>
                  <Td className="font-medium text-slate-800">{formatMonthLabel(p.periodMonth)}</Td>
                  <Td mono className="font-semibold text-slate-900">
                    {formatInr(decimalToNumber(p.amount))}
                  </Td>
                  <Td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-slate-100 text-slate-700">
                      {p.paymentMethod.replace("_", " ")}
                    </span>
                  </Td>
                  <Td>
                    {p.receipt ? (
                      <Link
                        href="/admin/receipts"
                        className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {p.receipt.receiptNumber}
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        {/* KYC & Verified Documents Vault */}
        <StaffDocumentsSection staffId={staff.id} canUpload={true} canDelete={true} />
      </div>
    </AppShell>
  );
}
