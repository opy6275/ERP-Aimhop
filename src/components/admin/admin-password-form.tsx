"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Key } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export function AdminPasswordForm({ adminEmail }: { adminEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to update password");
        return;
      }

      setSuccess("Your admin password has been changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-500 block">Logged In Account:</span>
          <span className="font-bold text-slate-800 font-mono mt-0.5 block">{adminEmail}</span>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
          Admin Account
        </span>
      </div>

      <div>
        <label className={labelClass}>Current Password *</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`${inputClass} pr-10 font-mono`}
            placeholder="Enter your current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>New Password *</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${inputClass} pr-10 font-mono`}
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Confirm New Password *</label>
          <input
            type={showNew ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${inputClass} font-mono`}
            placeholder="Re-enter new password"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          size="sm"
        >
          <Key size={14} />
          <span>Update Admin Password</span>
        </Button>
      </div>
    </form>
  );
}
