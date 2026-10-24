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

  // ISOLATED CLEAN PRINTING: Prints ONLY the Wall Poster on A4 paper (Zero background page/dashboard clutter)
  const handlePrint = () => {
    if (!qrDataUrl) return;

    // Create a hidden iframe for isolated, clean printing
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(frame);
      window.print();
      return;
    }

    const timeStr = currentTime || new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });

    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AimHop - Official Workplace Attendance Wall Poster</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    }
    body {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 100vh !important;
      padding: 6mm !important;
    }
    .poster-container {
      width: 100% !important;
      max-width: 185mm !important;
      margin: 0 auto !important;
      border: 3.5px solid #0f172a !important;
      border-radius: 24px !important;
      padding: 8mm 6mm !important;
      text-align: center !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
    }
    .poster-logo {
      width: 82px !important;
      height: 82px !important;
      object-fit: contain !important;
      margin: 0 auto 2mm auto !important;
      display: block !important;
    }
    .poster-title {
      font-size: 26pt !important;
      font-weight: 900 !important;
      color: #0f172a !important;
      margin: 2mm 0 1.5mm 0 !important;
      line-height: 1.15 !important;
      letter-spacing: -0.5px !important;
    }
    .poster-link-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      background: #eff6ff !important;
      border: 1.5px solid #bfdbfe !important;
      color: #1d4ed8 !important;
      padding: 2.5mm 7mm !important;
      border-radius: 9999px !important;
      font-size: 13pt !important;
      font-weight: 800 !important;
      letter-spacing: 0.5px !important;
      margin: 1.5mm auto !important;
    }
    .poster-sub {
      font-size: 9.5pt !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 1.5px !important;
      color: #64748b !important;
      margin-top: 2mm !important;
    }
    .poster-qr-frame {
      border: 3px solid #0f172a !important;
      border-radius: 22px !important;
      padding: 5mm !important;
      display: inline-block !important;
      margin: 5mm auto 3mm auto !important;
      background: #ffffff !important;
      position: relative !important;
    }
    .poster-qr-img {
      width: 75mm !important;
      height: 75mm !important;
      display: block !important;
      margin: 0 auto !important;
      object-fit: contain !important;
    }
    .poster-pill {
      background: #0f172a !important;
      color: #ffffff !important;
      border-radius: 9999px !important;
      padding: 2mm 6mm !important;
      font-size: 9.5pt !important;
      font-weight: 800 !important;
      display: inline-block !important;
      margin-top: 3mm !important;
    }
    .poster-guide-box {
      border: 1.5px solid #cbd5e1 !important;
      background: #f8fafc !important;
      border-radius: 14px !important;
      padding: 4mm 5mm !important;
      margin: 4mm auto 2mm auto !important;
      text-align: left !important;
      max-width: 165mm !important;
    }
    .poster-guide-title {
      font-weight: 800 !important;
      font-size: 10pt !important;
      color: #0f172a !important;
      margin-bottom: 2mm !important;
      border-bottom: 1px solid #e2e8f0 !important;
      padding-bottom: 1.5mm !important;
    }
    .poster-guide-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 3mm !important;
    }
    .poster-step-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 10px !important;
      padding: 2.5mm !important;
      font-size: 8.5pt !important;
      line-height: 1.3 !important;
      color: #334155 !important;
    }
    .poster-step-num {
      font-weight: 800 !important;
      color: #2563eb !important;
      margin-bottom: 1mm !important;
    }
    .poster-footer {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-size: 8.5pt !important;
      font-family: monospace !important;
      color: #64748b !important;
      border-top: 1px solid #e2e8f0 !important;
      padding-top: 2.5mm !important;
      margin-top: 4mm !important;
      max-width: 165mm !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
  </style>
</head>
<body>
  <div class="poster-container">
    <img src="/brand-logo.png" alt="AimHop Logo" class="poster-logo" />
    <div class="poster-title">${companyName}</div>
    <div class="poster-link-badge">
      <span>🌐 erp.aimhop.com</span>
    </div>
    <div class="poster-sub">Official Workplace Attendance Punch-In</div>

    <div class="poster-qr-frame">
      <img src="${qrDataUrl}" alt="AimHop Wall QR" class="poster-qr-img" />
      <div>
        <div class="poster-pill">✓ Permanent Office Wall QR</div>
      </div>
    </div>

    <div class="poster-guide-box">
      <div class="poster-guide-title">🏢 Attendance Lagane Ke Niyam (Instructions):</div>
      <div class="poster-guide-grid">
        <div class="poster-step-card">
          <div class="poster-step-num">Step 1: Camera / Lens</div>
          <div>Apne phone ke <b>Camera ya Lens</b> se yeh QR scan karein.</div>
        </div>
        <div class="poster-step-card">
          <div class="poster-step-num" style="color: #059669 !important;">Step 2: Instant Punch</div>
          <div>Scan karte hi aapki <b>Attendance (Present)</b> lag jayegi.</div>
        </div>
        <div class="poster-step-card">
          <div class="poster-step-num" style="color: #d97706 !important;">Step 3: Registration</div>
          <div>Agar aap registered nahi hain, toh <b>Admin/HR</b> se register karwayein.</div>
        </div>
      </div>
    </div>

    <div class="poster-footer">
      <span>AimHop Enterprise Security Suite</span>
      <span style="font-weight: bold; color: #0f172a;">erp.aimhop.com</span>
      <span>${timeStr} IST</span>
    </div>
  </div>
</body>
</html>`);
    frameDoc.close();

    // Trigger isolated print
    frame.onload = () => {
      setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          try {
            document.body.removeChild(frame);
          } catch {
            // Already removed
          }
        }, 3000);
      }, 400);
    };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card (Optimized on-screen preview) */}
      <div className="relative z-10 w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
        
        {/* On-Screen Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
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

        {/* Scrollable Modal Body (Exact Preview of Wall Poster) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-center space-y-4">
          
          {/* Company Brand Logo & Header */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 flex items-center justify-center">
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
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {companyName}
              </h2>
              {/* Official ERP Website Link */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs sm:text-sm font-bold text-blue-700 shadow-2xs">
                <Globe size={13} className="text-blue-600" />
                <span className="tracking-wide">erp.aimhop.com</span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
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
                <div className="relative p-3.5 sm:p-4 rounded-2xl border-2 border-slate-900 bg-white shadow-md inline-block">
                  {/* Corner Accent Marks for Premium Look */}
                  <div className="absolute top-1.5 left-1.5 h-3 w-3 border-t-2 border-l-2 border-blue-600" />
                  <div className="absolute top-1.5 right-1.5 h-3 w-3 border-t-2 border-r-2 border-blue-600" />
                  <div className="absolute bottom-1.5 left-1.5 h-3 w-3 border-b-2 border-l-2 border-blue-600" />
                  <div className="absolute bottom-1.5 right-1.5 h-3 w-3 border-b-2 border-r-2 border-blue-600" />

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Official Office Wall QR Poster"
                    className="h-48 w-48 sm:h-56 sm:w-56 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-900 rounded-full px-3.5 py-1 shadow-xs">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Permanent Office Wall QR</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* 3-Step Clear Visual Instructions */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-700 space-y-2">
            <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs pb-1 border-b border-slate-200">
              <Building2 size={15} className="text-blue-600" />
              <span>Attendance Lagane Ke Niyam (Instructions):</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  1
                </div>
                <p className="text-[11px] leading-tight text-slate-600">
                  Apne phone ke <strong>Camera ya Lens</strong> se yeh QR scan karein.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                  2
                </div>
                <p className="text-[11px] leading-tight text-slate-600">
                  Scan karte hi aapki <strong>Attendance (Present)</strong> lag jayegi.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                  3
                </div>
                <p className="text-[11px] leading-tight text-amber-800 font-medium">
                  Unregistered hone par Admin/HR se register karwayein.
                </p>
              </div>
            </div>
          </div>

          {/* Official Footer with portal and live time stamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100">
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

        {/* Action Buttons (Docked at footer) */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-3">
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
