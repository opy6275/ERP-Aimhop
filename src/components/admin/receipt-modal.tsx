"use client";

import { useState } from "react";
import { Receipt, Printer } from "@/components/ui/icons";
import { formatInr } from "@/lib/format";

export type ReceiptData = {
  id: string;
  receiptNumber: string;
  companyName: string;
  employeeName: string;
  staffCode: string;
  departmentName: string;
  periodLabel: string;
  amountPaid: number;
  paymentMethod: string;
  authorizedBy?: string | null;
  issuedAt: string;
};

export function ReceiptModal({ receipt }: { receipt: ReceiptData }) {
  const [open, setOpen] = useState(false);

  function handlePrint() {
    const receiptEl = document.querySelector('.printable-receipt') as HTMLElement;
    if (!receiptEl) return;

    // Create a hidden iframe for isolated, clean printing
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(frame);
      return;
    }

    // Copy all page stylesheets so Tailwind classes + fonts work in the iframe
    const sheets: string[] = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((el) =>
      sheets.push(el.outerHTML)
    );
    document.querySelectorAll('style').forEach((el) =>
      sheets.push(el.outerHTML)
    );

    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt - ${receipt.receiptNumber}</title>
${sheets.join('\n')}
<style>
  @media print {
    @page { size: A4; margin: 10mm; }
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #0f172a;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    padding: 24px;
    font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  }
  .no-print { display: none !important; }
  /* Flatten receipt — no scroll, no flex constraints */
  .printable-receipt {
    width: 100% !important;
    max-width: 100% !important;
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    flex: none !important;
    padding: 0 !important;
    margin: 0 auto !important;
    page-break-inside: avoid;
  }
  .printable-receipt > * + * {
    margin-top: 14px;
  }
</style>
</head>
<body>
${receiptEl.outerHTML}
</body>
</html>`);
    frameDoc.close();

    // Wait for stylesheets + images to load, then print
    frame.onload = () => {
      setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        // Cleanup after print dialog closes
        setTimeout(() => {
          try { document.body.removeChild(frame); } catch { /* already removed */ }
        }, 2000);
      }, 500);
    };
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
        aria-label="View Receipt"
      >
        <Receipt size={12} />
        <span>Receipt</span>
      </button>

      {open && (
        <div className="print-receipt-overlay fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0 print:m-0 print:block">
          {/* Modal Backdrop - hidden on print */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity no-print print:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Modal / Printable Receipt Container */}
          <div className="print-receipt-card relative z-10 w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:max-w-none print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">
            {/* Modal Screen Header - hidden on print */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6 sm:py-4 no-print print:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Payment Receipt</h3>
                  <p className="font-mono text-[10px] sm:text-xs text-slate-500">{receipt.receiptNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Official Receipt Content - scrollable within modal, fully printable */}
            <div className="printable-receipt flex-1 overflow-y-auto p-4 space-y-4 sm:p-6 sm:space-y-5 print:p-4 print:space-y-3 print:overflow-visible bg-white">
              {/* Header with Official AimHop Logo */}
              <div className="border-b-2 border-slate-900 pb-3 sm:pb-5 print:pb-2 text-center flex flex-col items-center">
                <img
                  src="/brand-logo.png"
                  alt="AimHop Logo"
                  className="mb-1.5 sm:mb-2 h-12 w-12 sm:h-16 sm:w-16 object-contain select-none print:h-14 print:w-14 print:mb-1 print:block"
                />
                <h2 className="text-base sm:text-xl print:text-lg font-extrabold uppercase tracking-tight text-slate-950">
                  {receipt.companyName || "AimHop CRM"}
                </h2>
                <p className="text-[10px] sm:text-xs font-semibold tracking-widest text-slate-600 uppercase mt-0.5">
                  Official Salary Disbursement Receipt
                </p>
                <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 sm:gap-2 rounded-md border border-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-50 font-mono text-[10px] sm:text-xs font-bold text-slate-800">
                  <span>RECEIPT NO:</span>
                  <span className="text-blue-700">{receipt.receiptNumber}</span>
                </div>
              </div>

              {/* Employee & Payment Metadata Grid */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 print:p-3 print:bg-white print:border-slate-300 print:rounded-lg">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Employee Name</span>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 break-words">{receipt.employeeName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Staff Code</span>
                    <p className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{receipt.staffCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Department</span>
                    <p className="font-semibold text-slate-800 mt-0.5 text-xs sm:text-sm break-words">{receipt.departmentName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Disbursement Period</span>
                    <p className="font-semibold text-slate-800 mt-0.5 text-xs sm:text-sm">{receipt.periodLabel}</p>
                  </div>
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="flex items-center justify-between rounded-xl bg-blue-50/80 p-3 sm:p-5 print:p-3 border border-blue-100 print:border-slate-900 print:bg-slate-50 print:rounded-lg gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold text-blue-900 uppercase tracking-wider">Total Disbursed Amount</p>
                  <p className="text-[10px] sm:text-xs text-blue-700/80 capitalize mt-0.5">Payment Method: {receipt.paymentMethod.replace("_", " ")}</p>
                </div>
                <p className="font-mono text-lg sm:text-2xl font-black text-blue-950 print:text-slate-950 shrink-0">
                  {formatInr(receipt.amountPaid)}
                </p>
              </div>

              {/* Authorization & Issue Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">Authorized By: </span>
                  <span className="font-semibold text-slate-800">{receipt.authorizedBy || "Accounts Officer"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Date Issued: </span>
                  <span className="font-semibold text-slate-800">{receipt.issuedAt}</span>
                </div>
              </div>

              {/* Printable Signatures Block */}
              <div className="pt-4 sm:pt-8 print:pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 sm:gap-8 text-xs">
                <div>
                  <p className="text-slate-400 mb-4 sm:mb-8 print:mb-6 font-medium">Employee Signature</p>
                  <div className="border-b border-slate-400 w-24 sm:w-36 print:w-44" />
                  <p className="font-semibold text-slate-800 mt-1 text-[10px] sm:text-xs break-words">{receipt.employeeName}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-slate-400 mb-4 sm:mb-8 print:mb-6 font-medium">Authorized Signatory & Seal</p>
                  <div className="border-b border-slate-400 w-24 sm:w-36 print:w-44" />
                  <p className="font-semibold text-slate-800 mt-1 text-[10px] sm:text-xs break-words">{receipt.authorizedBy || "AimHop CRM Accounts"}</p>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[9px] sm:text-[10px] text-slate-400 pt-3 sm:pt-4 border-t border-dashed border-slate-200">
                This is an official computer-generated receipt issued by AimHop CRM. Valid without physical stamp if electronically verified.
              </p>
            </div>

            {/* Modal Screen Footer Actions - hidden on print */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-6 sm:py-3.5 no-print print:hidden">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
