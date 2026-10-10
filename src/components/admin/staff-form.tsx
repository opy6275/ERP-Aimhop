"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Building2, CreditCard, Key, Eye, EyeOff, Info, AlertCircle, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

  // Portal credentials state
  const [createLogin, setCreateLogin] = useState(true);
  const [emailValue, setEmailValue] = useState("");
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleEmailChange(val: string) {
    setEmailValue(val);
    if (!portalEmail || portalEmail === emailValue) {
      setPortalEmail(val);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const salaryRaw = fd.get("salaryAmount");
    const salaryAmount = salaryRaw && String(salaryRaw).trim() !== "" ? Number(salaryRaw) : 0;

    const payload = {
      fullName: String(fd.get("fullName") || ""),
      mobile: String(fd.get("mobile") || "") || null,
      email: emailValue.trim() || null,
      designation: String(fd.get("designation") || "") || null,
      departmentId: String(fd.get("departmentId") || ""),
      categoryId: String(fd.get("categoryId") || ""),
      joiningDate: String(fd.get("joiningDate") || "") || null,
      employmentType: String(fd.get("employmentType") || "") || null,
      salaryAmount,
      paymentType: String(fd.get("paymentType") || "monthly"),
      bankName: String(fd.get("bankName") || "") || null,
      accountNumber: String(fd.get("accountNumber") || "") || null,
      ifsc: String(fd.get("ifsc") || "") || null,
      upiId: String(fd.get("upiId") || "") || null,
      address: String(fd.get("address") || "") || null,
      gender: String(fd.get("gender") || "") || null,
      dateOfBirth: String(fd.get("dateOfBirth") || "") || null,
      status: "active",
      createLogin,
      portalEmail: createLogin ? (portalEmail.trim() || emailValue.trim() || null) : null,
      portalPassword: createLogin ? portalPassword : null,
    };

    if (createLogin && !payload.portalEmail) {
      setError("Please specify a login email address for the staff portal account.");
      setLoading(false);
      return;
    }

    if (createLogin && (!payload.portalPassword || payload.portalPassword.length < 6)) {
      setError("Portal password must be at least 6 characters.");
      setLoading(false);
      return;
    }

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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <User size={18} />
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
              placeholder="Legal full name"
            />
          </div>

          <div>
            <label className={labelClass}>Mobile Phone Number</label>
            <input
              name="mobile"
              className={inputClass}
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              title="10-digit mobile number"
            />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              name="email"
              type="email"
              value={emailValue}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={inputClass}
              placeholder="name@company.com"
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
              placeholder="Street address, city, state, postal code"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Organizational Placement */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Building2 size={18} />
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
              placeholder="Job title"
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Compensation & Banking</h3>
            <p className="text-xs text-slate-500">Salary structure and disbursement account</p>
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
                className={`${inputClass} pl-8 font-mono font-semibold`}
                placeholder="0 (Optional)"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bank Name</label>
            <input
              name="bankName"
              className={inputClass}
              placeholder="Bank name"
            />
          </div>

          <div>
            <label className={labelClass}>Account Number</label>
            <input
              name="accountNumber"
              className={`${inputClass} font-mono`}
              placeholder="Account number"
            />
          </div>

          <div>
            <label className={labelClass}>IFSC Code</label>
            <input
              name="ifsc"
              className={`${inputClass} font-mono uppercase`}
              placeholder="IFSC code"
            />
          </div>

          <div>
            <label className={labelClass}>UPI Virtual Address</label>
            <input
              name="upiId"
              className={inputClass}
              placeholder="UPI ID (optional)"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Portal Login & Authentication Credentials */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Portal Login Credentials</h3>
              <p className="text-xs text-slate-500">Employee access to staff self-service portal</p>
            </div>
          </div>

          <Switch
            checked={createLogin}
            onCheckedChange={setCreateLogin}
            label="Enable Portal Login"
            badge={true}
          />
        </div>

        {createLogin ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Login Email Address *</label>
                <input
                  type="email"
                  required={createLogin}
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  className={inputClass}
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Portal Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={createLogin}
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className={`${inputClass} font-mono pr-10`}
                    placeholder="Password (minimum 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Portal login credentials are not enabled. Access can be granted at any time.
          </p>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Employee Record…</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Create Staff Record</span>
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
    </form>
  );
}
