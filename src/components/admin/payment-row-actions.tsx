"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptModal, ReceiptData } from "@/components/admin/receipt-modal";
import { Mail, Trash2, Check } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function PaymentRowActions({
  paymentId,
  receipt,
  amountFormatted,
  employeeName,
  emailSentAt,
  emailSentTo,
}: {
  paymentId: string;
  receipt: ReceiptData | null;
  amountFormatted: string;
  employeeName: string;
  emailSentAt?: string | null;
  emailSentTo?: string | null;
}) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(emailSentTo || "");
  const [deleting, setDeleting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSendEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      setEmailStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch(`/api/v1/admin/payments/${paymentId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailStatus({
          type: "error",
          message: data.message || data.error || "Could not deliver salary slip email.",
        });
        return;
      }
      setEmailStatus({
        type: "success",
        message: `Salary slip delivered to ${data.data?.recipient || recipientEmail}!`,
      });
      setTimeout(() => {
        setIsEmailModalOpen(false);
        router.refresh();
      }, 1000);
    } catch {
      setEmailStatus({ type: "error", message: "Network error while sending email." });
    } finally {
      setSendingEmail(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/payments/${paymentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setIsDeleteOpen(false);
        return;
      }
      setIsDeleteOpen(false);
      router.refresh();
    } catch {
      setIsDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 justify-end">
        {/* Email Salary Slip Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEmailStatus(null);
            setRecipientEmail(emailSentTo || "");
            setIsEmailModalOpen(true);
          }}
          className={`h-7 px-2.5 text-xs transition ${
            emailSentAt
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
          title={
            emailSentAt
              ? `Emailed on ${emailSentAt} to ${emailSentTo || "employee"}. Click to resend.`
              : "Send salary slip to employee email"
          }
        >
          {emailSentAt ? (
            <Check size={12} className="text-emerald-600" />
          ) : (
            <Mail size={12} className="text-blue-600" />
          )}
          <span>{emailSentAt ? "Emailed" : "Email Slip"}</span>
        </Button>

        {receipt && <ReceiptModal receipt={receipt} />}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={deleting}
          onClick={() => setIsDeleteOpen(true)}
          className="h-7 px-2.5 text-xs text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
          title="Void / Delete Transaction"
        >
          <Trash2 size={12} className="text-rose-500" />
          <span>Void</span>
        </Button>
      </div>

      {/* Email Salary Slip Modal (Replaces window.prompt) */}
      <Modal
        open={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Email Salary Slip"
        description={`Send the verified salary slip of ${amountFormatted} to ${employeeName}.`}
        size="default"
      >
        <form onSubmit={handleSendEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Email Address *
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Official PDF details will be generated and dispatched via configured company SMTP.
            </p>
          </div>

          {emailStatus && (
            <div
              className={`rounded-lg border p-2.5 text-xs font-medium ${
                emailStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {emailStatus.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEmailModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendingEmail}
              loading={sendingEmail}
            >
              <Mail size={14} />
              <span>Send Salary Slip</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Void / Delete Confirmation Dialog (Replaces window.confirm) */}
      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Void Payment Transaction"
        description={`Are you sure you want to void and permanently delete this payment transaction of ${amountFormatted} for ${employeeName}? This will also cancel any associated receipts.`}
        confirmText="Void Transaction"
        confirmTone="danger"
        loading={deleting}
      />
    </>
  );
}
