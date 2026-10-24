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

      // Extract staff and metadata supporting both top-level and nested response formats
      const staffObj = data.staff || data.data?.staff;
      const alreadyMarked = data.alreadyMarked ?? data.data?.alreadyMarked ?? false;
      const message = data.message || data.data?.message || "Attendance lag chuki hai (Present)!";
      const checkinTime = data.checkinTime || data.data?.checkinTime || new Date().toLocaleTimeString("en-IN");

      // Success! Remember this staff on this phone so future scans are 100% instant
      try {
        if (staffObj?.staffCode) {
          localStorage.setItem("aimhop_saved_staff_code", staffObj.staffCode);
          localStorage.setItem("aimhop_saved_staff_name", staffObj.fullName || "");
        }
      } catch {
        // Ignore storage error
      }

      setSuccessData({
        alreadyMarked,
        message,
        checkinTime,
        staff: staffObj || {
          id: "",
          fullName: "Staff Member",
          staffCode: idToUse.trim().toUpperCase(),
          department: "General",
        },
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-xs font-semibold text-blue-700 mb-2.5">
          <Sparkles size={13} className="text-blue-600" />
          <span>Office Wall QR Attendance</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Instant Contactless Punch-In</p>
      </div>

      {/* ============================================================== */}
      {/* 1. SUCCESS STATE: DIRECT ACCESS & ATTENDANCE RECORDED */}
      {/* ============================================================== */}
      {successData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 text-center shadow-sm space-y-5 animate-in zoom-in-95 duration-200">
          {/* Status Badge */}
          <div
            className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-sm ${
              successData.alreadyMarked
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}
          >
            <CheckCircle2 size={44} className="stroke-[2.5]" />
            <span
              className={`absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white font-bold text-xs shadow-xs ${
                successData.alreadyMarked ? "bg-blue-600" : "bg-emerald-600"
              }`}
            >
              <Sparkles size={12} />
            </span>
          </div>

          <div className="space-y-1.5">
            <div
              className={`inline-block px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                successData.alreadyMarked
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {successData.alreadyMarked ? "Already Marked Today" : "Attendance Recorded (Present)"}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {successData.alreadyMarked ? "Aap Pehle Hi Punch Kar Chuke Hain!" : `Welcome, ${successData.staff?.fullName || "Staff Member"}!`}
            </h2>
            <p className={`text-xs font-medium ${successData.alreadyMarked ? "text-blue-700" : "text-emerald-700"}`}>
              {successData.alreadyMarked
                ? "Aapki attendance aaj ke din pehle se hi recorded hai. Dobara punch karne ki zaroorat nahi hai."
                : "Aapki attendance safaltapoorvak lag chuki hai (Present)."}
            </p>
          </div>

          {/* Ticket Details Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User size={13} className="text-blue-600" /> Employee Name:
              </span>
              <span className="font-bold text-slate-900">{successData.staff?.fullName || "Staff Member"}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck size={13} className="text-emerald-600" /> Staff ID:
              </span>
              <span className="font-mono font-bold text-blue-600">{successData.staff?.staffCode || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 size={13} className="text-blue-600" /> Department:
              </span>
              <span className="font-semibold text-slate-800">{successData.staff?.department || "General"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-amber-600" /> {successData.alreadyMarked ? "Initial Punch-In Time:" : "Punch-In Time:"}
              </span>
              <span className="font-mono font-bold text-emerald-700">{successData.checkinTime} IST</span>
            </div>
            {successData.alreadyMarked && (
              <div className="pt-2 border-t border-slate-200 text-center">
                <p className="text-[11px] text-blue-700 font-medium">
                  ℹ️ Subah ka check-in time surakshit hai. Overwrite nahi kiya gaya.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            <Link
              href="/app/attendance"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-xs transition active:scale-[0.99]"
            >
              <CheckCircle2 size={17} />
              <span>Go to Staff Dashboard</span>
              <ArrowRight size={15} />
            </Link>

            <button
              type="button"
              onClick={handleClearSaved}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1 cursor-pointer transition"
            >
              Dusre Staff ka attendance lagayein? (Switch Account)
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. DIRECT ACCESS PUNCH CARD */
        /* ============================================================== */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Punch In Attendance</h2>
            <p className="text-xs text-slate-500">
              Apna Staff ID (e.g. STAFF-00005) ya Registered Mobile Number enter karein
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
                placeholder="Staff ID (e.g. STAFF-00005) ya Mobile"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 font-mono focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all text-center font-bold tracking-wider"
              />
            </div>

            {/* ERROR MESSAGE (CHOTA TEXT AS REQUESTED BY USER) */}
            {errorMessage && (
              <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 font-medium animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 text-amber-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white shadow-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-blue-200" />
                  <span>Verifying Staff...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  <span>Punch In Attendance</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400">
            <span>Ek baar punch karne ke baad aapka phone aapko yaad rakhega.</span>
          </div>
        </div>
      )}
    </div>
  );
}
