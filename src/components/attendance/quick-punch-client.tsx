"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  RefreshCw,
  LogOut,
} from "@/components/ui/icons";

type StaffData = {
  id: string;
  fullName: string;
  staffCode: string;
  department: string;
  designation?: string | null;
};

type PunchSuccess = {
  alreadyMarked: boolean;
  message: string;
  checkinTime: string;
  staff: StaffData;
};

export function QuickPunchClient({
  companyName,
  cid,
  sig,
  sessionStaff,
  initialSuccess,
  isUnregisteredNotice,
}: {
  companyName: string;
  cid?: string;
  sig?: string;
  sessionStaff?: StaffData | null;
  initialSuccess?: PunchSuccess | null;
  isUnregisteredNotice?: boolean;
}) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<PunchSuccess | null>(initialSuccess || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isUnregisteredNotice ? "Aap registered staff nahi hain. Kripya pehle register kariye." : null
  );
  const [autoTriggered, setAutoTriggered] = useState(false);

  // If initialSuccess was passed from server, save staff code to localStorage for future 0-click scans
  useEffect(() => {
    if (initialSuccess?.staff?.staffCode) {
      try {
        localStorage.setItem("aimhop_saved_staff_code", initialSuccess.staff.staffCode);
        localStorage.setItem("aimhop_saved_staff_name", initialSuccess.staff.fullName);
      } catch {
        // Ignore storage error
      }
    }
  }, [initialSuccess]);

  const performPunch = useCallback(async (idToUse: string) => {
    if (!idToUse.trim()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/attendance/quick-punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: idToUse.trim(),
          cid: cid || undefined,
          sig: sig || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If not registered staff -> Show exact requested small text
        const msg = data.message || "Aap registered staff nahi hain. Kripya pehle register kariye.";
        setErrorMessage(msg);
        return;
      }

      // Success! Remember this staff on this phone so future scans are 100% instant
      try {
        if (data.data?.staff?.staffCode) {
          localStorage.setItem("aimhop_saved_staff_code", data.data.staff.staffCode);
          localStorage.setItem("aimhop_saved_staff_name", data.data.staff.fullName);
        }
      } catch {
        // Ignore storage error
      }

      setSuccessData({
        alreadyMarked: data.data?.alreadyMarked || false,
        message: data.data?.message || "Attendance lag chuki hai (Present)!",
        checkinTime: data.data?.checkinTime || new Date().toLocaleTimeString("en-IN"),
        staff: data.data?.staff,
      });
    } catch {
      setErrorMessage("Network error. Kripya internet connection check karke dubara try karein.");
    } finally {
      setLoading(false);
    }
  }, [cid, sig]);

  // Auto-punch on scan if session exists or staff was previously remembered on this mobile
  useEffect(() => {
    if (autoTriggered || successData) return;
    setAutoTriggered(true);

    if (sessionStaff && sessionStaff.staffCode) {
      // Direct access via logged in session
      performPunch(sessionStaff.staffCode);
      return;
    }

    try {
      const savedCode = localStorage.getItem("aimhop_saved_staff_code");
      if (savedCode && savedCode.trim()) {
        setIdentifier(savedCode);
        performPunch(savedCode);
      }
    } catch {
      // Ignore
    }
  }, [sessionStaff, performPunch, autoTriggered, successData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performPunch(identifier);
  };

  const handleClearSaved = () => {
    try {
      localStorage.removeItem("aimhop_saved_staff_code");
      localStorage.removeItem("aimhop_saved_staff_name");
    } catch {
      // Ignore
    }
    setSuccessData(null);
    setErrorMessage(null);
    setIdentifier("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
          <Sparkles size={13} />
          <span>AimHop Office Attendance</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">{companyName}</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Instant Wall QR Punch-In</p>
      </div>

      {/* ============================================================== */}
      {/* 1. SUCCESS STATE: DIRECT ACCESS & ATTENDANCE RECORDED */}
      {/* ============================================================== */}
      {successData ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/95 p-6 text-center shadow-2xl backdrop-blur-md space-y-5 animate-in zoom-in-95 duration-200">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 shadow-xl shadow-emerald-500/25 animate-bounce">
            <CheckCircle2 size={46} className="stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
              <Sparkles size={12} />
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-extrabold uppercase tracking-wider">
              {successData.alreadyMarked ? "Already Marked Today" : "Attendance Recorded (Present)"}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Welcome, {successData.staff.fullName}!
            </h2>
            <p className="text-xs text-emerald-400 font-semibold">
              {successData.alreadyMarked
                ? "Aapki attendance aaj ke din pehle se hi recorded hai."
                : "Aapki attendance safaltapoorvak lag chuki hai (Present)."}
            </p>
          </div>

          {/* Ticket Details */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User size={13} className="text-blue-400" /> Employee Name:
              </span>
              <span className="font-bold text-white">{successData.staff.fullName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" /> Staff ID:
              </span>
              <span className="font-mono font-bold text-blue-400">{successData.staff.staffCode}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-400" /> Department:
              </span>
              <span className="font-semibold text-slate-200">{successData.staff.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-amber-400" /> Punch-In Time:
              </span>
              <span className="font-mono font-bold text-emerald-300">{successData.checkinTime} IST</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Link
              href="/app/attendance"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.98]"
            >
              <CheckCircle2 size={18} />
              <span>Go to Staff Portal / Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={handleClearSaved}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-400 py-1 cursor-pointer transition"
            >
              Dusre Staff ka attendance lagayein? (Switch Account)
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. DIRECT ACCESS PUNCH CARD */
        /* ============================================================== */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md space-y-5">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-black text-white">Punch In Attendance</h2>
            <p className="text-xs text-slate-400">
              Apna Staff ID (e.g. STAFF-00001) ya Registered Mobile Number daalein
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Staff ID (e.g. STAFF-00001) ya Mobile"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder-slate-500 font-mono focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-center font-bold tracking-wide"
              />
            </div>

            {/* ERROR MESSAGE (CHOTA TEXT AS REQUESTED BY USER) */}
            {errorMessage && (
              <div className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 font-semibold animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-blue-200" />
                  <span>Verifying Staff...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Punch In Attendance</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
            <span>Ek baar punch karne ke baad aapka phone aapko yaad rakhega.</span>
          </div>
        </div>
      )}
    </div>
  );
}
