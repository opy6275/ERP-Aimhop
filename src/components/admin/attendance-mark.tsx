"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock } from "@/components/ui/icons";

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
    Object.fromEntries(staff.map((s) => [s.id, s.current || "present"])),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const list = useMemo(() => staff, [staff]);

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
          records: list.map((s) => ({
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
        text: `Successfully saved attendance for ${data.records?.length ?? list.length} staff members.`,
        success: true,
      });
      router.refresh();
    } catch {
      setMessage({ text: "Network error occurred. Please try again.", success: false });
    } finally {
      setLoading(false);
    }
  }

  function markAll(status: string) {
    setRows(Object.fromEntries(list.map((s) => [s.id, status])));
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  function changeDate(newDate: string) {
    setDay(newDate);
    router.push(`/admin/attendance?date=${newDate}`);
  }

  return (
    <div className="space-y-6">
      {/* Date & Bulk Action Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Selected Date
            </label>
            <input
              type="date"
              value={day}
              onChange={(e) => changeDate(e.target.value)}
              className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-2xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-4">
            <button
              type="button"
              onClick={() => changeDate(todayStr)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                day === todayStr
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => changeDate(yesterdayStr)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                day === yesterdayStr
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Bulk quick actions & Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => markAll("present")}
              className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll("absent")}
              className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition"
            >
              All Absent
            </button>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={loading || list.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Clock size={16} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Summary Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 mr-1">Current Status:</span>
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-semibold text-emerald-800">
          {summary.present} Present
        </span>
        <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 font-semibold text-rose-800">
          {summary.absent} Absent
        </span>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-semibold text-amber-800">
          {summary.leave} Leave
        </span>
        <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 font-semibold text-orange-800">
          {summary.half_day} Half Day
        </span>
      </div>

      {/* Feedback Toast */}
      {message ? (
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
      ) : null}

      {/* Staff Marking Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Attendance Status (Click to set)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((s) => {
                const currentStatus = rows[s.id] || "present";
                const initials = s.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);

                return (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.fullName}</p>
                          <p className="text-xs text-slate-400">{s.staffCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        {s.department.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Segmented Button Group */}
                      <div className="inline-flex rounded-xl border border-slate-200/90 bg-slate-100/70 p-1 gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const isSelected = currentStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRows((prev) => ({ ...prev, [s.id]: opt.value }))}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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
              {list.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-400">
                    No active staff enrolled. Add staff members first.
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
