"use client";

import { useState } from "react";
import { QrCode } from "@/components/ui/icons";
import { OfficeQrKioskModal } from "@/components/admin/office-qr-kiosk-modal";

export function OfficeQrButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
      >
        <QrCode size={15} className="text-blue-600" />
        <span>Office QR Kiosk</span>
      </button>

      <OfficeQrKioskModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
