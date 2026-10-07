"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "@/components/ui/icons";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  confirmTone?: "danger" | "warning" | "default";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant,
  confirmTone,
  loading = false,
}: ConfirmDialogProps) {
  const tone = confirmTone || variant || "default";
  const isDanger = tone === "danger";
  const isWarning = tone === "warning";

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      hideCloseButton={loading}
      className="p-0"
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isDanger
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : isWarning
              ? "bg-amber-50 text-amber-600 border border-amber-100"
              : "bg-blue-50 text-blue-600 border border-blue-100"
          }`}
        >
          {isDanger || isWarning ? <AlertTriangle size={20} /> : <Info size={20} />}
        </div>
        <div>
          <h4 className="text-base font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={onClose}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={isDanger ? "destructive" : "default"}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
