"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Filter,
  Search,
  CheckSquare,
  Square,
  Users,
} from "lucide-react";

type StaffRow = {
  id: string;
  staffCode: string;
  fullName: string;
  department: { name: string };
  current?: string;
};

const STATUS_OPTIONS: {
  value: string;
  label: string;
  activeClass: string;
}[] = [
  { value: "present", label: "Present", activeClass: "bg-emerald-600 text-white shadow-xs" },
  { value: "absent", label: "Absent", activeClass: "bg-rose-600 text-white shadow-xs" },
  { value: "leave", label: "Leave", activeClass: "bg-amber-600 text-white shadow-xs" },
  { value: "half_day", label: "Half Day", activeClass: "bg-orange-600 text-white shadow-xs" },
  { value: "holiday", label: "Holiday", activeClass: "bg-sky-600 text-white shadow-xs" },
];

export function AttendanceMark({
  date,
  staff,
}: {
  date: string;
  staff: StaffRow[];
}) {
  const router = useRouter();
  const [day, setDay] = useState(date);
  const [rows, setRows] = useState<Record<string, string>>(
    Object.fromEntries(staff.map((s) => [s.id, s.current || "present"]))
  );
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Extract distinct departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const s of staff) {
      if (s.department?.name) set.add(s.department.name);
    }
    return Array.from(set).sort();
  }, [staff]);

  // Filtered staff list based on department and search
  const filteredList = useMemo(() => {
    return staff.filter((s) => {
      const matchDept = departmentFilter === "all" || s.department?.name === departmentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.staffCode.toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [staff, departmentFilter, searchQuery]);

  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, half_day: 0, holiday: 0 };
    for (const id of Object.keys(rows)) {
      const st = rows[id];
      if (st && st in s) {
        s[st as keyof typeof s]++;
      }
    }
    return s;
  }, [rows]);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/admin/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: day,
          records: staff.map((s) => ({
            staffId: s.id,
            status: rows[s.id] || "present",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "Failed to save attendance records", success: false });
        return;
      }
      setMessage({
        text: `Successfully saved attendance for ${data.records?.length ?? staff.length} staff members.`,
        success: true,
      });
      router.refresh();
    } catch {
      setMessage({ text: "Network error occurred. Please try again.", success: false });
    } finally {
      setLoading(false);
    }
  }

  // Bulk actions
  function markAll(status: string) {
    setRows(Object.fromEntries(staff.map((s) => [s.id, status])));
  }

  function markFiltered(status: string) {
    setRows((prev) => {
      const next = { ...prev };
      for (const s of filteredList) {
        next[s.id] = status;
      }
      return next;
    });
  }

  function markSelected(status: string) {
    if (selectedStaffIds.size === 0) return;
    setRows((prev) => {
      const next = { ...prev };
      for (const id of selectedStaffIds) {
        next[id] = status;
      }
      return next;
    });
  }

  // Checkbox helpers
  const isAllSelected =
    filteredList.length > 0 && filteredList.every((s) => selectedStaffIds.has(s.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(filteredList.map((s) => s.id)));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  function changeDate(newDate: string) {
    setDay(newDate);
    router.push(`/admin/attendance?tab=daily&date=${newDate}`);
  }

  return (
    <div className="space-y-6">
      {/* Date & Global Action Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Roster Date
            </label>
            <input
              type="date"
              value={day}
              onChange={(e) => changeDate(e.target.value)}
              className="mt-1 block rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-4">
            <button
              type="button"
              onClick={() => changeDate(todayStr)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                day === todayStr
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => changeDate(yesterdayStr)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                day === yesterdayStr
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={loading || staff.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Clock size={16} className="animate-spin" />
                <span>Saving Roster…</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Attendance Roster</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Productivity Accelerators & Bulk Operations Toolbar */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/60 to-slate-50/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filters: Department & Search */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-48">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none transition focus:border-blue-500"
              >
                <option value="all">All Departments ({staff.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-44 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick search employee…"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bulk Preset Accelerators */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1 font-bold uppercase tracking-wider">
              <CheckSquare size={13} className="text-slate-500" />
              Batch Actions:
            </span>

            {departmentFilter !== "all" ? (
              <button
                type="button"
                onClick={() => markFiltered("present")}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
              >
                Mark {departmentFilter} Present
              </button>
            ) : (
              <button
                type="button"
                onClick={() => markAll("present")}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
              >
                All Present
              </button>
            )}

            <button
              type="button"
              onClick={() => markAll("absent")}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Selected Checkbox Batch Action Bar (shows when items are checked) */}
        {selectedStaffIds.size > 0 && (
          <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md">
                {selectedStaffIds.size} Selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedStaffIds(new Set())}
                className="text-slate-500 hover:text-slate-700 underline text-[11px] cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Set selected to:</span>
              <button
                type="button"
                onClick={() => markSelected("present")}
                className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => markSelected("absent")}
                className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Absent
              </button>
              <button
                type="button"
                onClick={() => markSelected("leave")}
                className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer"
              >
                Leave
              </button>
              <button
                type="button"
                onClick={() => markSelected("half_day")}
                className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-semibold hover:bg-orange-700 cursor-pointer"
              >
                Half Day
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Summary Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500 mr-1">Roster Summary:</span>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-800">
            {summary.present} Present
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 font-bold text-rose-800">
            {summary.absent} Absent
          </span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-bold text-amber-800">
            {summary.leave} Leave
          </span>
          <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 font-bold text-orange-800">
            {summary.half_day} Half Day
          </span>
        </div>

        <span className="text-slate-500 font-mono text-[11px]">
          Showing {filteredList.length} of {staff.length} workforce
        </span>
      </div>

      {/* Feedback Toast */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3.5 text-sm font-medium ${
            message.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <CheckCircle2 size={18} className={message.success ? "text-emerald-600" : "text-rose-600"} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Staff Marking Table with Checkboxes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Attendance Status (1-Click Set)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((s) => {
                const currentStatus = rows[s.id] || "present";
                const isChecked = selectedStaffIds.has(s.id);
                const initials = s.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      isChecked ? "bg-blue-50/40" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(s.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-bold text-blue-700 border border-blue-100">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.fullName}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.staffCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {s.department.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {/* Segmented Button Group */}
                      <div className="inline-flex flex-wrap rounded-xl border border-slate-200/90 bg-slate-100/70 p-0.5 gap-0.5 sm:p-1 sm:gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const isSelected = currentStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRows((prev) => ({ ...prev, [s.id]: opt.value }))}
                              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer sm:px-3 sm:py-1.5 sm:text-xs ${
                                isSelected
                                  ? opt.activeClass
                                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">
                    No matching staff members found with current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
