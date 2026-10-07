"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, CalendarCheck, MapPin } from "@/components/ui/icons";

export function StaffCheckinCard({
  todayStatus,
  todayApprovalStatus,
  todayNote,
  employeeName,
}: {
  todayStatus: string | null;
  todayApprovalStatus?: string | null;
  todayNote: string | null;
  employeeName: string;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string | null>(todayStatus);
  const [currentApprovalStatus, setCurrentApprovalStatus] = useState<string | null>(
    todayApprovalStatus || (todayStatus ? "approved" : null),
  );
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
      setCurrentApprovalStatus("pending");
      setMessage({
        text: `Check-in request for ${statusToSet.toUpperCase().replace("_", " ")} submitted successfully! Awaiting Admin Approval.`,
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs mb-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CalendarCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Daily Attendance Check-In
              </h3>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                Shift: 09:30 AM – 06:30 PM
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {todayStr}
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Status Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {liveTime && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
              <Clock size={13} className="text-slate-400" />
              <span>{liveTime}</span>
              <span className="text-[10px] text-slate-400 font-sans">IST</span>
            </div>
          )}

          {currentStatus ? (
            currentApprovalStatus === "pending" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                <Clock size={13} className="text-amber-600 animate-pulse" />
                Pending Approval
              </span>
            ) : currentApprovalStatus === "rejected" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Rejected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {currentStatus.replace("_", " ")}
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Not Checked In
            </span>
          )}
        </div>
      </div>

      <div className="pt-5">
        {currentStatus ? (
          currentApprovalStatus === "pending" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Check-in Submitted: <span className="uppercase text-amber-800 font-bold">{currentStatus.replace("_", " ")}</span> (Pending Admin Approval)
                  </p>
                  <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                    Your attendance request has been forwarded to management. It will reflect in your official register once accepted.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer self-start sm:self-auto transition"
              >
                {showOptions ? "Hide options" : "Modify request or note"}
              </button>
            </div>
          ) : currentApprovalStatus === "rejected" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-950">
                    Attendance Request Rejected by Admin
                  </p>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">
                    This shift has been marked as absent by the administrator. Contact HR if you have any questions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Attendance Approved as <span className="uppercase text-emerald-700 font-bold">{currentStatus.replace("_", " ")}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Logged for {employeeName} {todayNote ? `· Note: "${todayNote}"` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer self-start sm:self-auto transition"
              >
                {showOptions ? "Hide adjustment options" : "Adjust status or add note"}
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Ready to start today&apos;s shift?</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Click below to record your workplace attendance for today.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("present")}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 size={15} />
                <span>{loading ? "Recording…" : "Check In (Present)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                More Options…
              </button>
            </div>
          </div>
        )}

        {/* Extended options drawer */}
        {showOptions && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                <MapPin size={13} className="text-blue-500" />
                <span>Work Location / Check-In Note</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Office, client site, or remote notes"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-500 mr-2">Override Status:</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("present")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
              >
                Present Full Day
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("half_day")}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition cursor-pointer disabled:opacity-60"
              >
                Half Day Shift
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckin("leave")}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-60"
              >
                Mark Leave
              </button>
            </div>
          </div>
        )}

        {message && (
          <p
            className={`mt-3.5 rounded-lg border p-3 text-xs font-medium ${
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
