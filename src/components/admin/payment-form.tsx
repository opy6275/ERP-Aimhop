"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StaffOpt = { id: string; staffCode: string; fullName: string; salaryAmount: number };

export function PaymentForm({ staff }: { staff: StaffOpt[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultDate = now.toISOString().slice(0, 10);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || "");
  const [amount, setAmount] = useState<number>(staff[0]?.salaryAmount || 0);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  const handleStaffChange = (id: string) => {
    setSelectedStaffId(id);
    const found = staff.find((s) => s.id === id);
    if (found && (!amount || amount === 0 || amount === selectedStaff?.salaryAmount)) {
      setAmount(found.salaryAmount);
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/v1/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: String(fd.get("staffId")),
          periodMonth: String(fd.get("periodMonth")),
          paymentDate: String(fd.get("paymentDate")),
          amount: Number(fd.get("amount")),
          paymentMethod: String(fd.get("paymentMethod")),
          paymentKind: String(fd.get("paymentKind")),
          note: String(fd.get("note") || "") || null,
          generateReceipt: fd.get("generateReceipt") === "on",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not record payment transaction");
        return;
      }
      router.push("/admin/payments");
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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {/* Employee Selector Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <label className={labelClass}>Select Employee Recipient *</label>
        <select
          name="staffId"
          required
          value={selectedStaffId}
          onChange={(e) => handleStaffChange(e.target.value)}
          className={`${inputClass} font-medium`}
        >
          <option value="" disabled>
            Choose an employee…
          </option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.staffCode} — {s.fullName} (Base: ₹{s.salaryAmount.toLocaleString("en-IN")})
            </option>
          ))}
        </select>

        {selectedStaff && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                {selectedStaff.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedStaff.fullName}</p>
                <p className="text-xs text-slate-600 font-mono">{selectedStaff.staffCode}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 font-medium block">Monthly Base Salary</span>
              <span className="text-base font-bold font-mono text-blue-700">
                ₹{selectedStaff.salaryAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Transaction Particulars</h3>
            <p className="text-xs text-slate-500">Period allocation, payment instrument, and amount</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Payroll Cycle Period (YYYY-MM) *</label>
            <input
              name="periodMonth"
              required
              defaultValue={defaultPeriod}
              pattern="\d{4}-\d{2}"
              placeholder="2026-09"
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>Disbursement Date *</label>
            <input
              name="paymentDate"
              type="date"
              required
              defaultValue={defaultDate}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + " mb-0"}>Disbursement Amount (₹) *</label>
              {selectedStaff && selectedStaff.salaryAmount > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(selectedStaff.salaryAmount)}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    100% (₹{selectedStaff.salaryAmount.toLocaleString("en-IN")})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(selectedStaff.salaryAmount / 2))}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(selectedStaff.salaryAmount / 4))}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    25%
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
              <input
                name="amount"
                type="number"
                min={1}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`${inputClass} pl-8 text-base font-mono font-bold text-slate-900`}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Payment Instrument / Method *</label>
            <select name="paymentMethod" className={inputClass} defaultValue="bank_transfer">
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash in Hand</option>
              <option value="other">Cheque / Demand Draft / Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Payment Classification / Kind *</label>
            <select name="paymentKind" className={inputClass} defaultValue="salary">
              <option value="salary">Full Month Salary</option>
              <option value="partial">Partial / Staggered Payout</option>
              <option value="advance">Salary Advance</option>
              <option value="adjustment">Incentive / Bonus / Adjustment</option>
              <option value="deduction">Deduction / Fine</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Remark / Reference Note</label>
            <input
              name="note"
              className={inputClass}
              placeholder="e.g. Monthly salary disbursed via HDFC Corporate Banking"
            />
          </div>
        </div>

        {/* Generate Receipt Option */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Generate Official Payment Receipt</p>
              <p className="text-xs text-slate-500">Automatically creates an audit-compliant receipt with unique tracking number.</p>
            </div>
          </div>
          <input
            type="checkbox"
            name="generateReceipt"
            defaultChecked
            className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
          />
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
              <span>Processing Transaction…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Record Payment & Issue Receipt</span>
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
