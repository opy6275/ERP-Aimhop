"use client";

import { useState } from "react";
import Image from "next/image";
import { Receipt, Printer, X, Mail } from "@/components/ui/icons";
import { formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";

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
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSendEmail(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      setEmailFeedback({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await fetch(`/api/v1/admin/receipts/${receipt.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEmailFeedback({
          type: "error",
          text: data.message || data.error || "Could not deliver email",
        });
      } else {
        setEmailFeedback({
          type: "success",
          text: data.message || `Salary slip delivered to ${data.data?.recipient || recipientEmail}!`,
        });
        setTimeout(() => {
          setShowEmailInput(false);
        }, 1500);
      }
    } catch {
      setEmailFeedback({
        type: "error",
        text: "Network communication error while sending email",
      });
    } finally {
      setSendingEmail(false);
    }
  }

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
        setTimeout(() => {
          try { document.body.removeChild(frame); } catch { /* already removed */ }
        }, 2000);
      }, 500);
    };
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
        aria-label="View Receipt"
      >
        <Receipt size={12} className="text-slate-500" />
        <span>Receipt</span>
      </Button>

      {open && (
        <div className="print-receipt-overlay fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0 print:m-0 print:block animate-in fade-in">
          {/* Modal Backdrop - hidden on print */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity no-print print:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Modal / Printable Receipt Container */}
          <div className="print-receipt-card relative z-10 w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl print:max-w-none print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">
            {/* Modal Screen Header - hidden on print */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6 sm:py-3.5 no-print print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Payment Receipt</h3>
                  <p className="font-mono text-xs text-slate-500">{receipt.receiptNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Official Receipt Content - scrollable within modal, fully printable */}
            <div className="printable-receipt flex-1 overflow-y-auto p-4 space-y-4 sm:p-6 sm:space-y-5 print:p-4 print:space-y-3 print:overflow-visible bg-white">
              {/* Header with Official AimHop Logo */}
              <div className="border-b-2 border-slate-900 pb-3 sm:pb-5 print:pb-2 text-center flex flex-col items-center">
                <Image
                  src="/brand-logo.png"
                  alt="AimHop Logo"
                  width={64}
                  height={64}
                  className="mb-1.5 sm:mb-2 h-12 w-12 sm:h-14 sm:w-14 object-contain select-none print:h-14 print:w-14 print:mb-1 print:block"
                />
                <h2 className="text-base sm:text-xl print:text-lg font-bold uppercase tracking-tight text-slate-950">
                  {receipt.companyName || "AimHop ERP"}
                </h2>
                <p className="text-[10px] sm:text-xs font-semibold tracking-widest text-slate-600 uppercase mt-0.5">
                  Official Salary Disbursement Receipt
                </p>
                <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 sm:gap-2 rounded-md border border-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-50 font-mono text-[10px] sm:text-xs font-semibold text-slate-800">
                  <span>RECEIPT NO:</span>
                  <span className="text-blue-700">{receipt.receiptNumber}</span>
                </div>
              </div>

              {/* Employee & Payment Metadata Grid */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4 print:p-3 print:bg-white print:border-slate-300 print:rounded-lg">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Employee Name</span>
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5 break-words">{receipt.employeeName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Staff Code</span>
                    <p className="font-mono font-semibold text-slate-900 text-xs sm:text-sm mt-0.5">{receipt.staffCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Department</span>
                    <p className="font-medium text-slate-800 mt-0.5 text-xs sm:text-sm break-words">{receipt.departmentName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[9px] sm:text-[10px] tracking-wider block">Disbursement Period</span>
                    <p className="font-medium text-slate-800 mt-0.5 text-xs sm:text-sm">{receipt.periodLabel}</p>
                  </div>
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="flex items-center justify-between rounded-lg bg-blue-50/80 p-3 sm:p-4 print:p-3 border border-blue-100 print:border-slate-900 print:bg-slate-50 gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-blue-900 uppercase tracking-wider">Total Disbursed Amount</p>
                  <p className="text-[10px] sm:text-xs text-blue-700/80 capitalize mt-0.5">Payment Method: {receipt.paymentMethod.replace("_", " ")}</p>
                </div>
                <p className="font-mono text-lg sm:text-2xl font-bold text-blue-950 print:text-slate-950 shrink-0">
                  {formatInr(receipt.amountPaid)}
                </p>
              </div>

              {/* Authorization & Issue Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">Authorized By: </span>
                  <span className="font-medium text-slate-800">{receipt.authorizedBy || "Accounts Officer"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Date Issued: </span>
                  <span className="font-medium text-slate-800">{receipt.issuedAt}</span>
                </div>
              </div>

              {/* Printable Signatures Block */}
              <div className="pt-4 sm:pt-8 print:pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 sm:gap-8 text-xs">
                <div>
                  <p className="text-slate-400 mb-4 sm:mb-8 print:mb-6 font-medium">Employee Signature</p>
                  <div className="border-b border-slate-400 w-24 sm:w-36 print:w-44" />
                  <p className="font-medium text-slate-800 mt-1 text-[10px] sm:text-xs break-words">{receipt.employeeName}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-slate-400 mb-4 sm:mb-8 print:mb-6 font-medium">Authorized Signatory & Seal</p>
                  <div className="border-b border-slate-400 w-24 sm:w-36 print:w-44" />
                  <p className="font-medium text-slate-800 mt-1 text-[10px] sm:text-xs break-words">{receipt.authorizedBy || "AimHop ERP Accounts"}</p>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[9px] sm:text-[10px] text-slate-400 pt-3 sm:pt-4 border-t border-dashed border-slate-200">
                This is an official computer-generated receipt issued by AimHop ERP. Valid without physical stamp if electronically verified.
              </p>
            </div>

            {/* Email Input Tray */}
            {showEmailInput && (
              <form onSubmit={handleSendEmail} className="px-4 py-3 bg-slate-50 border-t border-slate-200 no-print flex items-center gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter employee email..."
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingEmail}
                  loading={sendingEmail}
                >
                  Send
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailInput(false)}
                >
                  Cancel
                </Button>
              </form>
            )}

            {/* Email Status Toast inside Modal */}
            {emailFeedback && (
              <div
                className={`px-4 py-2 text-xs font-medium flex items-center justify-between no-print ${
                  emailFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-t border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-t border-rose-200"
                }`}
              >
                <span>{emailFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setEmailFeedback(null)}
                  className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer"
                  aria-label="Dismiss feedback"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Modal Screen Footer Actions - hidden on print */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-6 sm:py-3 no-print print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEmailInput(!showEmailInput)}
                className="gap-1.5 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
              >
                <Mail size={13} />
                <span>Email Salary Slip</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5"
                >
                  <Printer size={13} />
                  <span>Print Receipt</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
