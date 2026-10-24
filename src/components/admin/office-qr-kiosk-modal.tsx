"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  X,
  Printer,
  Download,
  RefreshCw,
  ShieldCheck,
  Clock,
  Sparkles,
  Building2,
} from "@/components/ui/icons";

export function OfficeQrKioskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("AimHop ERP");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadQr = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/attendance/qr");
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Failed to load QR code");
        return;
      }
      const url = json.dataUrl || json.data?.dataUrl;
      const comp = json.companyName || json.data?.companyName;
      setQrDataUrl(url || null);
      setCompanyName(comp || "AimHop ERP");
    } catch {
      setError("Network error fetching QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQr();
    }
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `AimHop-Office-Wall-QR.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 print:static print:bg-white print:p-0">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl print:max-w-none print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">
        
        {/* Header - Matches AimHop ERP light theme */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Office Attendance Wall QR</h3>
              <p className="text-[11px] text-slate-500 font-medium">Permanent poster for workplace punch-in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-center space-y-4 print:p-8 print:border-4 print:border-slate-800 print:rounded-3xl print:m-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200/60">
            <Sparkles size={11} className="text-blue-600" />
            <span>AimHop Enterprise System</span>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {companyName}
            </h2>
            <p className="text-xs font-semibold text-blue-600">
              Official Workplace Attendance Punch-In
            </p>
          </div>

          {/* Clean, Non-overflowing QR Display */}
          <div className="my-3 flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 gap-2.5">
                <RefreshCw size={24} className="animate-spin text-blue-600" />
                <span className="text-xs font-medium text-slate-500">Generating HD Wall QR...</span>
              </div>
            ) : error ? (
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                <p className="text-xs text-rose-700 font-medium">{error}</p>
                <button
                  onClick={loadQr}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700 cursor-pointer"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : qrDataUrl ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-200 p-2.5 bg-white shadow-2xs inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Official Office Wall QR Poster"
                    className="h-48 w-48 sm:h-56 sm:w-56 object-contain rounded-lg print:h-80 print:w-80"
                  />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Permanent Office Poster QR</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Instructions Card (Clean & Compact) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
              <span>Attendance Lagane Ke Niyam (Instructions):</span>
            </p>
            <ol className="list-decimal pl-4 space-y-1 font-medium">
              <li>Apne phone ke <strong>Camera ya AimHop App</strong> se yeh QR scan karein.</li>
              <li>Scan karte hi aapki <strong>Daily Attendance (Present)</strong> lag jayegi.</li>
              <li className="text-amber-800 font-medium">
                ⚠️ Agar aapka account registered nahi hai, toh Admin/HR se registration karwayein.
              </li>
            </ol>
          </div>

          {/* Live timestamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 print:hidden">
            <span>Verified System</span>
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <Clock size={12} className="text-blue-600" />
              {currentTime} IST
            </span>
          </div>
        </div>

        {/* Footer with Actions (Always visible, perfectly docked) */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-3 print:hidden">
          <button
            onClick={loadQr}
            title="Refresh QR token"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Poster (A4)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
