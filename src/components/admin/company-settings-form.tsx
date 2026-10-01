"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CompanyData = {
  name: string;
  legalName: string | null;
  currency: string;
  timezone: string;
  receiptFooter: string | null;
};

export function CompanySettingsForm({ initialCompany }: { initialCompany: CompanyData | null }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      legalName: String(fd.get("legalName") || "") || null,
      currency: String(fd.get("currency") || "INR"),
      timezone: String(fd.get("timezone") || "Asia/Kolkata"),
      receiptFooter: String(fd.get("receiptFooter") || "") || null,
    };

    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not save company settings");
        return;
      }
      setSuccess("Company profile updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Network communication error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Company Name</span>
            <span className="mt-1 text-base font-bold text-slate-900 block">{initialCompany?.name ?? "AimHop CRM"}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Legal Registered Entity</span>
            <span className="mt-1 text-base font-bold text-slate-900 block">{initialCompany?.legalName ?? "AimHop Solutions Pvt. Ltd."}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Accounting Currency</span>
            <span className="mt-1 text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span className="font-mono text-blue-600">₹</span> {initialCompany?.currency ?? "INR"} (Indian Rupee)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Operating Timezone</span>
            <span className="mt-1 text-base font-bold text-slate-900 block">{initialCompany?.timezone ?? "Asia/Kolkata (IST)"}</span>
          </div>

          <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Receipt Legal Footer Note</span>
            <span className="mt-1 font-medium text-slate-800 block">
              {initialCompany?.receiptFooter ?? "This is a computer-generated receipt and does not require physical signature."}
            </span>
          </div>
        </div>

        {success && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            {success}
          </p>
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Company Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company Brand Name *</label>
          <input name="name" required defaultValue={initialCompany?.name || "AimHop CRM"} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Legal Entity Name</label>
          <input name="legalName" defaultValue={initialCompany?.legalName || ""} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Standard Currency</label>
          <select name="currency" defaultValue={initialCompany?.currency || "INR"} className={inputClass}>
            <option value="INR">INR (₹ Indian Rupee)</option>
            <option value="USD">USD ($ US Dollar)</option>
            <option value="EUR">EUR (€ Euro)</option>
            <option value="AED">AED (د.إ UAE Dirham)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Corporate Timezone</label>
          <select name="timezone" defaultValue={initialCompany?.timezone || "Asia/Kolkata"} className={inputClass}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC (Universal)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Receipt Legal Footer</label>
          <textarea
            name="receiptFooter"
            rows={2}
            defaultValue={initialCompany?.receiptFooter || ""}
            className={inputClass}
            placeholder="Official disclaimer printed on salary and disbursement receipts"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
