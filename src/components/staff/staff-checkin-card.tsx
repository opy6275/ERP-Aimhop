"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, CalendarCheck, Sparkles, MapPin } from "@/components/ui/icons";

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
  const [liveTime, setLiveTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
        text: `Shift recorded successfully as ${statusToSet.toUpperCase().replace("_", " ")}!`,
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
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm mb-7 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 border border-blue-200/60 shadow-xs">
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Shift Telemetry & Check-In Desk
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                <Sparkles size={10} /> Active Roster
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {todayStr} · <span className="text-slate-700 font-semibold">Standard Shift (09:30 AM - 06:30 PM)</span>
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Status Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {liveTime && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 font-mono text-xs font-bold text-slate-700 shadow-2xs">
              <Clock size={13} className="text-slate-400" />
              <span>{liveTime}</span>
              <span className="text-[10px] text-slate-400 font-sans">IST</span>
            </div>
          )}

          {currentStatus ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentStatus.replace("_", " ")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Pending Check-In
            </span>
          )}
        </div>
      </div>

      <div className="pt-6">
        {currentStatus ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-white border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  Duty status verified: You are checked in as <span className="uppercase text-emerald-700">{currentStatus.replace("_", " ")}</span>
                </p>
                <p className="text-xs text-emerald-700/90 font-medium mt-0.5">
                  Logged for {employeeName} {todayNote ? `· Remark: "${todayNote}"` : "· Normal workplace presence"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer self-start sm:self-auto transition"
            >
              {showOptions ? "Close adjustment" : "Adjust status / add location note"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/20 to-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Commence daily work shift?</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Record your attendance timestamp in the official company shift ledger.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("present")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>{loading ? "Recording Timestamp…" : "Clock In (Present)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                More Options…
              </button>
            </div>
          </div>
        )}

        {/* Extended options drawer */}
        {showOptions && (
          <div className="mt-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                <MapPin size={13} className="text-blue-500" />
                <span>Work Location / Check-In Note</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Head Office - Desk 4B, Client Site, Work From Home"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 mr-2">Override Status:</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("present")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer disabled:opacity-60"
              >
                Present Full Day
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("half_day")}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition cursor-pointer disabled:opacity-60"
              >
                Half Day Shift
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("leave")}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition cursor-pointer disabled:opacity-60"
              >
                Mark Leave
              </button>
            </div>
          </div>
        )}

        {message && (
          <p
            className={`mt-3.5 rounded-xl border p-3.5 text-xs font-bold ${
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
