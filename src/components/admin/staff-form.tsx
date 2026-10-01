"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Opt = { id: string; name: string };

export function StaffForm({
  departments,
  categories,
}: {
  departments: Opt[];
  categories: Opt[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: String(fd.get("fullName") || ""),
      mobile: String(fd.get("mobile") || "") || null,
      email: String(fd.get("email") || "") || null,
      designation: String(fd.get("designation") || "") || null,
      departmentId: String(fd.get("departmentId") || ""),
      categoryId: String(fd.get("categoryId") || ""),
      joiningDate: String(fd.get("joiningDate") || "") || null,
      employmentType: String(fd.get("employmentType") || "") || null,
      salaryAmount: Number(fd.get("salaryAmount") || 0),
      paymentType: String(fd.get("paymentType") || "monthly"),
      bankName: String(fd.get("bankName") || "") || null,
      accountNumber: String(fd.get("accountNumber") || "") || null,
      ifsc: String(fd.get("ifsc") || "") || null,
      upiId: String(fd.get("upiId") || "") || null,
      address: String(fd.get("address") || "") || null,
      gender: String(fd.get("gender") || "") || null,
      dateOfBirth: String(fd.get("dateOfBirth") || "") || null,
      status: "active",
    };

    try {
      const res = await fetch("/api/v1/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not create staff record");
        return;
      }
      router.push(`/admin/staff/${data.staff.id}`);
      router.refresh();
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      {/* Section 1: Personal & Contact */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Personal & Identity Information</h3>
            <p className="text-xs text-slate-500">Employee legal name and primary contact details</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full Legal Name *</label>
            <input
              name="fullName"
              required
              className={inputClass}
              placeholder="e.g. Priya Sharma"
            />
          </div>

          <div>
            <label className={labelClass}>Mobile Phone Number</label>
            <input
              name="mobile"
              className={inputClass}
              placeholder="e.g. 9876543210"
              pattern="[0-9]{10}"
              title="10-digit mobile number"
            />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              name="email"
              type="email"
              className={inputClass}
              placeholder="e.g. priya.sharma@aimhop.com"
            />
          </div>

          <div>
            <label className={labelClass}>Gender</label>
            <select name="gender" className={inputClass} defaultValue="">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <input name="dateOfBirth" type="date" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Residential Address</label>
            <textarea
              name="address"
              rows={2}
              className={inputClass}
              placeholder="Door No, Street, Landmark, City, Pincode"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Organizational Placement */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Organizational Assignment</h3>
            <p className="text-xs text-slate-500">Department, classification tier, and job designation</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Department *</label>
            <select name="departmentId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Select department
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Employment Category *</label>
            <select name="categoryId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Select category
              </option>
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
              className={inputClass}
              placeholder="e.g. Senior Operations Analyst"
            />
          </div>

          <div>
            <label className={labelClass}>Employment Contract Type</label>
            <select name="employmentType" className={inputClass} defaultValue="Full-time">
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
              className={inputClass}
              defaultValue={new Date().toISOString().slice(0, 10)}
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
            <h3 className="text-base font-semibold text-slate-900">Compensation & Settlement Accounts</h3>
            <p className="text-xs text-slate-500">Pay frequency, baseline salary amount, and bank credentials</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Payment Frequency Scheme</label>
            <select name="paymentType" className={inputClass} defaultValue="monthly">
              <option value="monthly">Monthly Fixed Salary</option>
              <option value="daily">Daily Wage / Variable</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Base Salary Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">₹</span>
              <input
                name="salaryAmount"
                type="number"
                min={0}
                step="1"
                required
                defaultValue={25000}
                className={`${inputClass} pl-8 font-mono font-semibold`}
                placeholder="25000"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bank Name</label>
            <input
              name="bankName"
              className={inputClass}
              placeholder="e.g. HDFC Bank / State Bank of India"
            />
          </div>

          <div>
            <label className={labelClass}>Account Number</label>
            <input
              name="accountNumber"
              className={`${inputClass} font-mono`}
              placeholder="e.g. 5010049281726"
            />
          </div>

          <div>
            <label className={labelClass}>IFSC Code</label>
            <input
              name="ifsc"
              className={`${inputClass} font-mono uppercase`}
              placeholder="e.g. HDFC0001234"
            />
          </div>

          <div>
            <label className={labelClass}>UPI Virtual Address</label>
            <input
              name="upiId"
              className={inputClass}
              placeholder="e.g. priya@okhdfcbank"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-2.5">
          <svg className="w-5 h-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Creating Employee Record…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Create Staff Record</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
