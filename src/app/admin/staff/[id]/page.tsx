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

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });
  const { id } = await params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
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
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm mb-6">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl font-bold text-white shadow-md shadow-blue-500/20">
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
            <Link
              href={`/admin/staff/${staff.id}/edit`}
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Details
            </Link>
            <Link
              href="/admin/attendance"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >

              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mark Attendance
            </Link>
            <Link
              href="/admin/payments/new"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Pay Salary
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
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
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
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
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
      </div>
    </AppShell>
  );
}
