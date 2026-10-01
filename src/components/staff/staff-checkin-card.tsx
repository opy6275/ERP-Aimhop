"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, CalendarCheck } from "@/components/ui/icons";

export function StaffCheckinCard({
  todayStatus,
  todayNote,
  employeeName,
}: {
  todayStatus: string | null;
  todayNote: string | null;
  employeeName: string;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string | null>(todayStatus);
  const [note, setNote] = useState<string>(todayNote || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  async function handleCheckin(statusToSet: "present" | "half_day" | "leave") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/me/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusToSet, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || "Failed to record attendance", success: false });
        return;
      }
      setCurrentStatus(statusToSet);
      setMessage({
        text: `Checked in successfully as ${statusToSet.toUpperCase().replace("_", " ")}!`,
        success: true,
      });
      setShowOptions(false);
      router.refresh();
    } catch {
      setMessage({ text: "Network connection error", success: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CalendarCheck size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Shift Check-In & Presence</h3>
            <p className="text-xs text-slate-500 font-medium">{todayStr} · Asia/Kolkata (IST)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentStatus ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentStatus.replace("_", " ")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Not Checked In
            </span>
          )}
        </div>
      </div>

      <div className="pt-5">
        {currentStatus ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  You are checked in for today as <span className="uppercase">{currentStatus.replace("_", " ")}</span>
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Logged for {employeeName} {todayNote ? `· Remark: "${todayNote}"` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer self-start sm:self-auto"
            >
              {showOptions ? "Hide options" : "Update status / note"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Ready to start your work shift?</p>
                <p className="text-xs text-slate-500">Record your presence in the official company shift roster.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("present")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>{loading ? "Recording…" : "Check In (Present)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                More…
              </button>
            </div>
          </div>
        )}

        {/* Extended options drawer */}
        {showOptions && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Check-in Remark / Work Location Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Office Desk B-4, On-site client visit, or WFH"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-2">Set Status:</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("present")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
              >
                Present
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("half_day")}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition cursor-pointer disabled:opacity-60"
              >
                Half Day Shift
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("leave")}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition cursor-pointer disabled:opacity-60"
              >
                Mark on Leave
              </button>
            </div>
          </div>
        )}

        {message && (
          <p
            className={`mt-3 rounded-xl border p-3 text-xs font-semibold ${
              message.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
