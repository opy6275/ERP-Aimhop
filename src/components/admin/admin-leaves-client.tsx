"use client";

import { useState } from "react";
import { LeaveRecord } from "@/lib/leaves";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Td } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { Check, X, Search } from "@/components/ui/icons";
import { AdminLeaveReviewModal } from "./admin-leave-review-modal";

interface AdminLeavesClientProps {
  leaves: LeaveRecord[];
  departments: { id: string; name: string }[];
}

export function AdminLeavesClient({ leaves, departments }: AdminLeavesClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const [activeReview, setActiveReview] = useState<{
    leave: LeaveRecord;
    actionType: "approve" | "reject";
  } | null>(null);

  const filteredLeaves = leaves.filter((l) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (selectedDept !== "all" && l.departmentName !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = l.staffName?.toLowerCase().includes(q);
      const matchCode = l.staffCode?.toLowerCase().includes(q);
      const matchReason = l.reason.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchReason) return false;
    }
    return true;
  });

  const pendingCount = leaves.filter((l) => l.status === "pending").length;

  return (
    <>
      <Panel
        title="Workforce Leave Requests"
        subtitle="Review employee time-off applications, synchronize attendance, and manage leave records."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff, code, reason..."
                className="h-9 w-48 sm:w-64 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 transition focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {/* Status Filter Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: "pending", label: `Pending Review (${pendingCount})`, highlight: pendingCount > 0 },
            { id: "all", label: `All Requests (${leaves.length})` },
            { id: "approved", label: `Approved (${leaves.filter((l) => l.status === "approved").length})` },
            { id: "rejected", label: `Rejected (${leaves.filter((l) => l.status === "rejected").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : tab.highlight
                  ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile Card List (< md) */}
        <div className="space-y-3 md:hidden">
          {filteredLeaves.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              No leave requests match the current filters.
            </div>
          ) : (
            filteredLeaves.map((leave) => {
              const startFmt = formatDate(new Date(leave.startDate));
              const endFmt = formatDate(new Date(leave.endDate));
              const dateStr = startFmt === endFmt ? startFmt : `${startFmt} – ${endFmt}`;

              return (
                <div
                  key={leave.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{leave.staffName}</span>
                      <span className="text-xs text-slate-500">
                        {leave.staffCode} {leave.departmentName && `· ${leave.departmentName}`}
                      </span>
                    </div>
                    <StatusBadge value={leave.status} />
                  </div>

                  <div className="mt-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Dates:</span>
                      <span className="font-semibold text-slate-800">{dateStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration & Type:</span>
                      <span className="font-medium text-slate-700">
                        {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"} · <span className="capitalize font-semibold text-blue-700">{leave.leaveType}</span>
                      </span>
                    </div>
                    {leave.reason && (
                      <div className="pt-1 border-t border-slate-200/60 text-slate-600 italic">
                        &ldquo;{leave.reason}&rdquo;
                      </div>
                    )}
                    {leave.reviewNote && (
                      <div className="text-[11px] text-slate-500 pt-0.5">
                        Note: &ldquo;{leave.reviewNote}&rdquo; {leave.reviewerEmail && `(${leave.reviewerEmail})`}
                      </div>
                    )}
                  </div>

                  {leave.status === "pending" && (
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setActiveReview({ leave, actionType: "approve" })}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => setActiveReview({ leave, actionType: "reject" })}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition active:scale-95"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table (>= md) */}
        <div className="hidden md:block">
          <DataTable
            headers={[
              "Staff Member",
              "Dates Requested",
              "Duration",
              "Leave Type",
              "Reason",
              "Status",
              "Review Notes",
              "Actions",
            ]}
          >
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-xs text-slate-500">
                  No leave requests match the current filters.
                </td>
              </tr>
            ) : (
              filteredLeaves.map((leave) => {
                const startFmt = formatDate(new Date(leave.startDate));
                const endFmt = formatDate(new Date(leave.endDate));
                const dateStr = startFmt === endFmt ? startFmt : `${startFmt} – ${endFmt}`;

                return (
                  <tr key={leave.id} className="transition hover:bg-slate-50/70">
                    <Td>
                      <div>
                        <span className="font-semibold text-slate-900 block">{leave.staffName}</span>
                        <span className="text-xs text-slate-500">
                          {leave.staffCode} {leave.departmentName && `· ${leave.departmentName}`}
                        </span>
                      </div>
                    </Td>
                    <Td className="font-medium text-slate-800">{dateStr}</Td>
                    <Td className="tabular-nums font-semibold text-slate-700">
                      {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
                        {leave.leaveType}
                      </span>
                    </Td>
                    <Td className="max-w-xs truncate text-slate-600">
                      <span title={leave.reason}>{leave.reason}</span>
                    </Td>
                    <Td>
                      <StatusBadge value={leave.status} />
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {leave.reviewNote ? (
                        <div>
                          <span className="italic text-slate-700 block">&ldquo;{leave.reviewNote}&rdquo;</span>
                          {leave.reviewerEmail && (
                            <span className="text-[10px] text-slate-400">by {leave.reviewerEmail}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </Td>
                    <Td>
                      {leave.status === "pending" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveReview({ leave, actionType: "approve" })}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition active:scale-95 border border-emerald-200"
                            title="Approve and mark attendance as leave"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => setActiveReview({ leave, actionType: "reject" })}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition active:scale-95 border border-rose-200"
                            title="Reject leave application"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Resolved</span>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </DataTable>
        </div>
      </Panel>

      {activeReview && (
        <AdminLeaveReviewModal
          leave={activeReview.leave}
          actionType={activeReview.actionType}
          onClose={() => setActiveReview(null)}
        />
      )}
    </>
  );
}
