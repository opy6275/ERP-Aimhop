"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Loader2,
  Sparkles,
  Users,
} from "@/components/ui/icons";

type ApprovalRecord = {
  id: string;
  date: string;
  status: "present" | "absent" | "leave" | "half_day" | "holiday";
  approvalStatus: "pending" | "approved" | "rejected";
  note: string | null;
  createdAt: string;
  staff: {
    id: string;
    staffCode: string;
    fullName: string;
    designation: string | null;
    email: string | null;
    mobile: string | null;
    department: { id: string; name: string };
  };
};

export function AttendanceApprovalsPanel({
  initialDate,
}: {
  initialDate?: string;
}) {
  const router = useRouter();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [viewMode, setViewMode] = useState<"date" | "all">("date");
  const [statusFilter, setStatusFilter] = useState<"pending" | "all" | "approved" | "rejected">("pending");
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; success: boolean } | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v1/admin/attendance/approvals", window.location.origin);
      if (viewMode === "date") {
        url.searchParams.set("date", selectedDate);
      } else {
        url.searchParams.set("date", "all");
      }
      url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotalPendingCount(data.totalPendingCount || 0);
      }
    } catch (e) {
      console.error("Failed to load attendance requests", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function showToast(text: string, success: boolean) {
    setToastMessage({ text, success });
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleSingleAction(recordId: string, action: "approve" | "reject", finalStatus?: "present" | "half_day") {
    setActionLoadingId(recordId);
    try {
      const res = await fetch("/api/v1/admin/attendance/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recordId,
          finalStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to update attendance request", false);
        return;
      }

      showToast(
        action === "approve"
          ? "Attendance request successfully ACCEPTED & status updated!"
          : "Attendance request REJECTED (marked absent).",
        true,
      );

      // Refresh list & server router cache
      await fetchRecords();
      router.refresh();
    } catch {
      showToast("Network error. Please try again.", false);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleBatchAction(action: "approve_all" | "reject_all") {
    const pendingIds = records.filter((r) => r.approvalStatus === "pending").map((r) => r.id);
    if (pendingIds.length === 0) return;

    if (action === "reject_all" && !confirm(`Are you sure you want to REJECT all ${pendingIds.length} pending attendance requests?`)) {
      return;
    }

    setBatchLoading(true);
    try {
      const res = await fetch("/api/v1/admin/attendance/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recordIds: pendingIds,
          date: viewMode === "date" ? selectedDate : "all",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Batch action failed", false);
        return;
      }

      showToast(
        action === "approve_all"
          ? `Successfully approved ${data.count ?? pendingIds.length} attendance requests!`
          : `Rejected ${data.count ?? pendingIds.length} attendance requests.`,
        true,
      );

      await fetchRecords();
      router.refresh();
    } catch {
      showToast("Network error during batch approval.", false);
    } finally {
      setBatchLoading(false);
    }
  }

  const pendingInCurrentView = records.filter((r) => r.approvalStatus === "pending");

  return (
    <div className="space-y-6">
      {/* Top Controls & Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Attendance Requests & Approvals
                </h3>
                {totalPendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                    {totalPendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve employee daily shift check-in requests.
              </p>
            </div>
          </div>

          {/* Quick Date / Scope Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("date")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "date"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Day-Wise View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Pending ({totalPendingCount})
              </button>
            </div>

            {viewMode === "date" && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    selectedDate === todayStr
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Today
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Filter & Batch Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
            {(
              [
                { id: "pending", label: "Pending Approval" },
                { id: "all", label: "All Statuses" },
                { id: "approved", label: "Approved" },
                { id: "rejected", label: "Rejected" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Batch Approve Button */}
          {pendingInCurrentView.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => handleBatchAction("approve_all")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
              >
                {batchLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Approve All Pending ({pendingInCurrentView.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
            toastMessage.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toastMessage.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 size={28} className="animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-semibold">Loading attendance requests…</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 mb-3">
              <Sparkles size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Attendance Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {statusFilter === "pending"
                ? `There are no pending attendance check-in requests ${
                    viewMode === "date" ? `for ${selectedDate}` : "at this time"
                  }. All staff shifts are processed.`
                : "No matching records found for the selected filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Requested Status</th>
                  <th className="py-3 px-4">Location / Remarks</th>
                  <th className="py-3 px-4 text-center">Approval State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const isPending = r.approvalStatus === "pending";
                  const isApproved = r.approvalStatus === "approved";
                  const isRejected = r.approvalStatus === "rejected";
                  const isRowLoading = actionLoadingId === r.id;

                  const dateFormatted = new Date(r.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  });

                  const timeFormatted = new Date(r.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                  });

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isPending ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Employee details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700 text-xs border border-blue-100">
                            {r.staff.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{r.staff.fullName}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <span>{r.staff.staffCode}</span>
                              <span>·</span>
                              <span className="font-sans text-slate-600">{r.staff.department.name}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{dateFormatted}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{timeFormatted} IST</span>
                        </div>
                      </td>

                      {/* Requested Status */}
                      <td className="py-3 px-4">
                        {r.status === "present" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Present (Full Day)
                          </span>
                        ) : r.status === "half_day" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700 uppercase">
                            <Clock size={11} />
                            Half Day (0.5)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-700 uppercase">
                            <CalendarDays size={11} />
                            {r.status}
                          </span>
                        )}
                      </td>

                      {/* Location / Note */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700 italic font-medium">
                          {r.note || "Standard Workplace Check-In"}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            <Clock size={11} className="text-amber-600 animate-spin" />
                            Pending Admin Action
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Accepted & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                            <XCircle size={11} className="text-rose-600" />
                            Rejected (Absent)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isRowLoading ? (
                          <div className="flex justify-end items-center pr-3">
                            <Loader2 size={15} className="animate-spin text-blue-600" />
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Accept / Approve Button */}
                            <button
                              type="button"
                              onClick={() => handleSingleAction(r.id, "approve", "present")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                              title="Accept attendance and mark as Present"
                            >
                              <Check size={13} />
                              <span>Accept</span>
                            </button>

                            {/* Half Day Option */}
                            <button
                              type="button"
                              onClick={() => handleSingleAction(r.id, "approve", "half_day")}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                              title="Accept as Half Day shift"
                            >
                              <span>0.5 Day</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              type="button"
                              onClick={() => handleSingleAction(r.id, "reject")}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                              title="Reject request and mark employee Absent"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSingleAction(r.id, isApproved ? "reject" : "approve")}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
                            >
                              {isApproved ? "Change to Absent" : "Re-approve Present"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
