"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertCircle } from "@/components/ui/icons";

interface AdminLeaveReviewModalProps {
  leave: {
    id: string;
    staffName?: string;
    staffCode?: string;
    leaveType: string;
    daysCount: number;
    reason: string;
    startDate: string;
    endDate: string;
  };
  actionType: "approve" | "reject";
  onClose: () => void;
}

export function AdminLeaveReviewModal({
  leave,
  actionType,
  onClose,
}: AdminLeaveReviewModalProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = actionType === "approve";

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/leaves/${leave.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isApprove ? "approved" : "rejected",
          reviewNote: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || `Failed to ${actionType} leave`);
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isApprove ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {isApprove ? <Check size={18} /> : <X size={18} />}
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {isApprove ? "Approve Leave Request" : "Reject Leave Request"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleReview} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee:</span>
              <span className="font-semibold text-slate-900">
                {leave.staffName} ({leave.staffCode})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-semibold text-slate-900">
                {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"} ({leave.leaveType.toUpperCase()})
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500">Reason:</span>
              <p className="mt-0.5 font-medium text-slate-800 italic">&ldquo;{leave.reason}&rdquo;</p>
            </div>
          </div>

          {isApprove && (
            <p className="text-xs text-emerald-700 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
              ℹ️ Approving this request will automatically synchronize attendance records and mark shift status as <strong>&ldquo;leave&rdquo;</strong> for these dates.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Review Remarks / Comments {isApprove ? "(Optional)" : "(Required)"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isApprove ? "e.g. Approved as per company policy..." : "e.g. Rejected due to critical project deadline..."}
              rows={3}
              required={!isApprove}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 ${
                isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {loading ? "Processing..." : isApprove ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
