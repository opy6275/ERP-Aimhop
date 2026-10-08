"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CalendarDays, AlertCircle, CheckCircle2 } from "@/components/ui/icons";
import type { LeaveBalanceData } from "@/lib/leaves";

export function StaffLeaveClient({ leaveBalance }: { leaveBalance?: LeaveBalanceData | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    leaveType: "casual",
    startDate: todayStr,
    endDate: todayStr,
    reason: "",
  });

  const calculateDays = () => {
    try {
      const s = new Date(form.startDate);
      const e = new Date(form.endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
      const diff = Math.abs(e.getTime() - s.getTime());
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 1;
    }
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (daysCount <= 0) {
      setError("End date cannot be earlier than start date");
      return;
    }

    if (!form.reason.trim() || form.reason.trim().length < 3) {
      setError("Please provide a valid reason (at least 3 characters)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType: form.leaveType,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Failed to submit leave request");
      }

      setSuccess("Leave request submitted successfully!");
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        setForm({
          leaveType: "casual",
          startDate: todayStr,
          endDate: todayStr,
          reason: "",
        });
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
      >
        <Plus size={16} />
        Apply for Leave
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Apply for Time Off</h3>
                  <p className="text-xs text-slate-500">Submit a leave request for administrative review</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200/60">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="sick">Sick Leave (SL)</option>
                  <option value="paid">Paid Annual Leave (PL)</option>
                  <option value="unpaid">Leave Without Pay (LWP)</option>
                  <option value="other">Other / Special Leave</option>
                </select>

                {leaveBalance && (
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span>Quota Balance:</span>
                    <span className="font-bold text-slate-800">
                      {form.leaveType === "casual"
                        ? `${leaveBalance.clRemaining} days left (${leaveBalance.clUsed} used of ${leaveBalance.clTotal})`
                        : form.leaveType === "sick"
                        ? `${leaveBalance.slRemaining} days left (${leaveBalance.slUsed} used of ${leaveBalance.slTotal})`
                        : form.leaveType === "paid"
                        ? `${leaveBalance.plRemaining} days left (${leaveBalance.plUsed} used of ${leaveBalance.plTotal})`
                        : "Unlimited / Unpaid"}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
                <span className="font-medium text-slate-600">Calculated duration:</span>
                <span className="font-semibold text-blue-600">
                  {daysCount} {daysCount === 1 ? "day" : "days"}
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="State reason for leave request..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
