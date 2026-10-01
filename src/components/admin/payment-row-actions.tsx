"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptModal, ReceiptData } from "@/components/admin/receipt-modal";

export function PaymentRowActions({
  paymentId,
  receipt,
  amountFormatted,
  employeeName,
}: {
  paymentId: string;
  receipt: ReceiptData | null;
  amountFormatted: string;
  employeeName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to void and delete this payment transaction of ${amountFormatted} for ${employeeName}? This will also cancel any generated receipt.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/payments/${paymentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Could not delete payment");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error while deleting payment");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {receipt && <ReceiptModal receipt={receipt} />}
      <button
        type="button"
        disabled={deleting}
        onClick={handleDelete}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer disabled:opacity-50"
        title="Void / Delete Transaction"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {deleting ? "…" : "Void"}
      </button>
    </div>
  );
}
