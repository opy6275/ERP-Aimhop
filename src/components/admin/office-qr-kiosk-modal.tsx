"use client";

import { useEffect, useState } from "react";
import { QrCode, X, Printer, Download, RefreshCw, ShieldCheck, Clock, Sparkles, Building2 } from "@/components/ui/icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-white text-slate-900 shadow-2xl print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Header (Hidden when printing poster) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Office Wall QR Poster</h3>
              <p className="text-xs text-slate-400 font-medium">Diwaar par lagane ke liye Official Attendance QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable & Scannable QR Poster Body */}
        <div className="p-8 text-center print:p-8 print:border-4 print:border-slate-900 print:rounded-3xl print:m-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 mb-3">
            <Sparkles size={13} />
            <span>AimHop Enterprise Attendance System</span>
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {companyName}
          </h2>
          <p className="text-sm font-semibold text-blue-700 mt-1">
            Official Workplace Attendance Punch-In
          </p>

          {/* QR Image Display */}
          <div className="my-6 mx-auto flex items-center justify-center">
            {loading ? (
              <div className="flex h-72 w-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 gap-3">
                <RefreshCw size={32} className="animate-spin text-blue-600" />
                <span className="text-xs font-semibold text-slate-500">Generating HD Wall QR...</span>
              </div>
            ) : error ? (
              <div className="flex h-64 w-64 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
                <p className="text-xs text-rose-700 font-semibold">{error}</p>
                <button
                  onClick={loadQr}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : qrDataUrl ? (
              <div className="relative rounded-3xl border-4 border-slate-900 p-4 bg-white shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Official Office Wall QR Poster"
                  className="h-72 w-72 rounded-2xl object-contain print:h-80 print:w-80"
                />
                <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-1 text-[11px] font-bold text-white shadow-md flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Permanent Wall Attendance QR</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Hindi & English Scanning Instructions */}
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-xs text-slate-700">
            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <span>Attendance Lagane Ke Niyam (Instructions):</span>
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600 font-medium">
              <li>Apne mobile ke <strong>Camera ya AimHop App</strong> se yeh QR code scan karein.</li>
              <li>Scan karte hi aapki <strong>Daily Attendance (Present)</strong> lag jayegi.</li>
              <li className="text-amber-800 font-semibold">
                ⚠️ Agar aapka account registered nahi hai, toh Admin/HR se registration karwayein.
              </li>
            </ol>
          </div>

          {/* Clock footer (Hidden when printing) */}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500 font-mono print:hidden">
            <span>AimHop Workplace Security</span>
            <span className="flex items-center gap-1 text-slate-700 font-bold">
              <Clock size={13} className="text-blue-600" />
              {currentTime} IST
            </span>
          </div>

          {/* Action Buttons (Hidden when printing) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>Print Wall Poster (A4)</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>Download High-Res PNG</span>
            </button>
            <button
              onClick={loadQr}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
