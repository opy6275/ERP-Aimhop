"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  Globe,
  Camera,
  CheckCircle2,
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
      <div className="relative z-10 w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl print:max-w-none print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">
        
        {/* On-Screen Header (Hidden when printing poster) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Office Attendance Wall Poster</h3>
              <p className="text-[11px] text-slate-500 font-medium">A4 Printable Poster for Workplace Wall</p>
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

        {/* Scrollable Printable Poster Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-center space-y-4 print:p-10 print:border-4 print:border-slate-900 print:rounded-3xl print:m-6 print:space-y-6">
          
          {/* Company Brand Logo & Header */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 print:h-24 print:w-24 shrink-0 flex items-center justify-center">
              <Image
                src="/brand-logo.png"
                alt="AimHop Logo"
                width={80}
                height={80}
                priority
                className="h-full w-full object-contain select-none drop-shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl print:text-4xl font-black text-slate-900 tracking-tight">
                {companyName}
              </h2>
              {/* Official ERP Website Link */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs sm:text-sm print:text-base font-bold text-blue-700 shadow-2xs">
                <Globe size={13} className="text-blue-600" />
                <span className="tracking-wide">erp.aimhop.com</span>
              </div>
              <p className="text-[11px] sm:text-xs print:text-sm font-bold uppercase tracking-widest text-slate-500 mt-1">
                Official Workplace Attendance Punch-In
              </p>
            </div>
          </div>

          {/* High-Definition QR Code Card */}
          <div className="my-2 sm:my-3 flex flex-col items-center justify-center">
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
                <div className="relative p-3.5 sm:p-4 print:p-5 rounded-2xl border-2 border-slate-900 bg-white shadow-md inline-block">
                  {/* Corner Accent Marks for Premium Look */}
                  <div className="absolute top-1.5 left-1.5 h-3 w-3 border-t-2 border-l-2 border-blue-600" />
                  <div className="absolute top-1.5 right-1.5 h-3 w-3 border-t-2 border-r-2 border-blue-600" />
                  <div className="absolute bottom-1.5 left-1.5 h-3 w-3 border-b-2 border-l-2 border-blue-600" />
                  <div className="absolute bottom-1.5 right-1.5 h-3 w-3 border-b-2 border-r-2 border-blue-600" />

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Official Office Wall QR Poster"
                    className="h-48 w-48 sm:h-56 sm:w-56 print:h-72 print:w-72 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] print:text-xs font-bold text-white bg-slate-900 rounded-full px-3.5 py-1 shadow-xs">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Permanent Office Wall QR</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* 3-Step Clear Visual Instructions */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:p-5 text-left text-xs print:text-sm text-slate-700 space-y-2">
            <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs print:text-base pb-1 border-b border-slate-200">
              <Building2 size={15} className="text-blue-600" />
              <span>Attendance Lagane Ke Niyam (Instructions):</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  1
                </div>
                <p className="text-[11px] print:text-xs leading-tight text-slate-600">
                  Apne phone ke <strong>Camera ya Lens</strong> se yeh QR scan karein.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                  2
                </div>
                <p className="text-[11px] print:text-xs leading-tight text-slate-600">
                  Scan karte hi aapki <strong>Attendance (Present)</strong> lag jayegi.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                  3
                </div>
                <p className="text-[11px] print:text-xs leading-tight text-amber-800 font-medium">
                  Unregistered hone par Admin/HR se register karwayein.
                </p>
              </div>
            </div>
          </div>

          {/* Official Footer with portal and live time stamp */}
          <div className="flex items-center justify-between text-[11px] print:text-xs text-slate-500 font-mono pt-2 border-t border-slate-100 print:border-slate-300">
            <div className="flex items-center gap-1.5">
              <Globe size={12} className="text-blue-600" />
              <span className="font-semibold text-slate-700">erp.aimhop.com</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 font-semibold">
              <Clock size={12} className="text-blue-600" />
              <span>{currentTime} IST</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Docked at footer, hidden when printing) */}
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Wall Poster (A4)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
