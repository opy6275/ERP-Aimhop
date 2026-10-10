"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CheckCircle2, AlertCircle, Trash2, Save, Loader2 } from "lucide-react";

type Opt = { id: string; name: string };

type StaffData = {
  id: string;
  staffCode: string;
  fullName: string;
  mobile: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  departmentId: string;
  categoryId: string;
  designation: string | null;
  joiningDate: string | null;
  employmentType: string | null;
  status: "active" | "inactive";
  salaryAmount: number;
  paymentType: "monthly" | "daily";
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
};

export function StaffEditForm({
  staff,
  departments,
  categories,
}: {
  staff: StaffData;
  departments: Opt[];
  categories: Opt[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    const salaryRaw = fd.get("salaryAmount");
    const salaryAmount = salaryRaw && String(salaryRaw).trim() !== "" ? Number(salaryRaw) : 0;

    const payload = {
      fullName: String(fd.get("fullName") || ""),
      mobile: String(fd.get("mobile") || "") || null,
      email: String(fd.get("email") || "") || null,
      designation: String(fd.get("designation") || "") || null,
      departmentId: String(fd.get("departmentId") || ""),
      categoryId: String(fd.get("categoryId") || ""),
      joiningDate: String(fd.get("joiningDate") || "") || null,
      employmentType: String(fd.get("employmentType") || "") || null,
      salaryAmount,
      paymentType: String(fd.get("paymentType") || "monthly"),
      status: String(fd.get("status") || "active"),
      bankName: String(fd.get("bankName") || "") || null,
      accountNumber: String(fd.get("accountNumber") || "") || null,
      ifsc: String(fd.get("ifsc") || "") || null,
      upiId: String(fd.get("upiId") || "") || null,
      address: String(fd.get("address") || "") || null,
      gender: String(fd.get("gender") || "") || null,
      dateOfBirth: String(fd.get("dateOfBirth") || "") || null,
    };

    try {
      const res = await fetch(`/api/v1/admin/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not update staff record");
        return;
      }
      setSuccess("Staff profile updated successfully!");
      setTimeout(() => {
        router.push(`/admin/staff/${staff.id}`);
        router.refresh();
      }, 1000);
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/staff/${staff.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not delete staff member");
        setDeleting(false);
        return;
      }
      setDeleteOpen(false);
      router.push("/admin/staff");
      router.refresh();
    } catch {
      setError("Network error while attempting to delete employee.");
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      {/* Section 1: Personal & Contact */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Personal Details</h3>
              <p className="text-xs text-slate-500">Contact details and identification</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {staff.staffCode}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full Legal Name *</label>
            <input
              name="fullName"
              required
              defaultValue={staff.fullName}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Mobile Phone Number</label>
            <input
              name="mobile"
              defaultValue={staff.mobile || ""}
              className={inputClass}
              placeholder="Mobile phone number"
            />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              name="email"
              type="email"
              defaultValue={staff.email || ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Gender</label>
            <select name="gender" className={inputClass} defaultValue={staff.gender || ""}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              defaultValue={staff.dateOfBirth ? staff.dateOfBirth.slice(0, 10) : ""}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Residential Address</label>
            <textarea
              name="address"
              rows={2}
              defaultValue={staff.address || ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Organizational Placement & Status */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Department & Role</h3>
            <p className="text-xs text-slate-500">Organizational assignment and employment status</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Department *</label>
            <select name="departmentId" required className={inputClass} defaultValue={staff.departmentId}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Employment Category *</label>
            <select name="categoryId" required className={inputClass} defaultValue={staff.categoryId}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Designation / Job Title</label>
            <input
              name="designation"
              defaultValue={staff.designation || ""}
              className={inputClass}
              placeholder="Job title"
            />
          </div>

          <div>
            <label className={labelClass}>Employment Status *</label>
            <select name="status" className={inputClass} defaultValue={staff.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Employment Contract Type</label>
            <select name="employmentType" className={inputClass} defaultValue={staff.employmentType || "Full-time"}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contractual</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Joining Date</label>
            <input
              name="joiningDate"
              type="date"
              defaultValue={staff.joiningDate ? staff.joiningDate.slice(0, 10) : ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Compensation & Banking */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Compensation & Banking</h3>
            <p className="text-xs text-slate-500">Salary structure and disbursement details</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Payment Frequency Scheme</label>
            <select name="paymentType" className={inputClass} defaultValue={staff.paymentType}>
              <option value="monthly">Monthly Fixed Salary</option>
              <option value="daily">Daily Wage / Variable</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Base Salary Amount (₹) <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">₹</span>
              <input
                name="salaryAmount"
                type="number"
                min={0}
                step="1"
                defaultValue={staff.salaryAmount ? staff.salaryAmount : ""}
                className={`${inputClass} pl-8 font-mono font-semibold`}
                placeholder="0 (Optional)"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bank Name</label>
            <input
              name="bankName"
              defaultValue={staff.bankName || ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Account Number</label>
            <input
              name="accountNumber"
              defaultValue={staff.accountNumber || ""}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>IFSC Code</label>
            <input
              name="ifsc"
              defaultValue={staff.ifsc || ""}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>

          <div>
            <label className={labelClass}>UPI Virtual Address</label>
            <input
              name="upiId"
              defaultValue={staff.upiId || ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      ) : null}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="submit"
            disabled={loading || deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Delete Action Button */}
        <button
          type="button"
          disabled={loading || deleting}
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? "Deleting Employee…" : "Delete Employee"}</span>
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Permanently Delete Staff Member?"
        description={`Are you sure you want to permanently delete ${staff.fullName} (${staff.staffCode})? This will permanently remove their employment records, payroll history, and attendance data. This action cannot be reversed.`}
        confirmText="Yes, Delete Employee"
        confirmTone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </form>
  );
}
