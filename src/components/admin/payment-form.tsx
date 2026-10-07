"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Mail, AlertCircle, CheckCircle2, Check, FileText, AlertTriangle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

type StaffOpt = {
  id: string;
  staffCode: string;
  fullName: string;
  salaryAmount: number;
  email?: string | null;
};

export function PaymentForm({ staff }: { staff: StaffOpt[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultDate = now.toISOString().slice(0, 10);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || "");
  const [amount, setAmount] = useState<number>(staff[0]?.salaryAmount || 0);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);
  const [sendEmail, setSendEmail] = useState(true);
  const [customEmail, setCustomEmail] = useState(staff[0]?.email || "");

  const handleStaffChange = (id: string) => {
    setSelectedStaffId(id);
    const found = staff.find((s) => s.id === id);
    if (found && (!amount || amount === 0 || amount === selectedStaff?.salaryAmount)) {
      setAmount(found.salaryAmount);
    }
    if (found) {
      setCustomEmail(found.email || "");
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
          sendEmail: sendEmail,
          recipientEmail: customEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not record payment transaction");
        return;
      }

      const emailRes = data.emailResult || data.data?.emailResult;
      const successMsg = emailRes?.unconfigured
        ? "Payment recorded successfully! Note: Salary slip was not emailed because SMTP is not configured."
        : emailRes?.error
        ? `Payment recorded! Note on email delivery: ${emailRes.error}`
        : "Payment recorded successfully! Generating official receipt...";

      setSuccess(successMsg);
      setTimeout(() => {
        router.push("/admin/payments");
        router.refresh();
      }, 1000);
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
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CreditCard size={18} />
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
              placeholder="Disbursement remarks or transaction reference"
            />
          </div>
        </div>

        {/* Generate Receipt Option */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
              <FileText size={18} />
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
            className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Email Salary Slip Option */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Email Salary Slip to Employee</p>
                <p className="text-xs text-slate-600">
                  Sends full payment voucher &amp; salary particulars directly to staff inbox.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-5 h-5 rounded-md border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {sendEmail && (
            <div className="pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 sm:w-36 shrink-0">
                Recipient Email:
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="employee@company.com"
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {!customEmail && (
                <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                  <AlertTriangle size={12} className="shrink-0" />
                  No email on profile. Enter email above.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800 flex items-center gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          size="lg"
          className="shadow-2xs"
        >
          <Check size={16} />
          <span>Record Payment & Issue Receipt</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
