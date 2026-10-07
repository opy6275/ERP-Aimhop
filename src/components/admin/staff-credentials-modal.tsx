"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  ShieldCheck,
  ShieldAlert,
} from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { inputClass, labelClass } from "@/lib/form-styles";

type UserData = {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | Date | null;
} | null;

export function StaffCredentialsModal({
  staffId,
  staffCode,
  staffName,
  contactEmail,
  user,
}: {
  staffId: string;
  staffCode: string;
  staffName: string;
  contactEmail: string | null;
  user: UserData;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState(user?.email || contactEmail || "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/staff/${staffId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to update credentials");
        return;
      }

      setSuccess(user ? "Password updated successfully!" : "Staff login account created successfully!");
      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/staff/${staffId}/credentials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to toggle status");
        return;
      }

      router.refresh();
    } catch {
      setError("Network communication error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmRevoke() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/staff/${staffId}/credentials`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to revoke login");
        return;
      }

      setRevokeOpen(false);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error while revoking credentials.");
    } finally {
      setLoading(false);
    }
  }



  return (
    <>
      {user ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setLoginEmail(user.email);
            setIsActive(user.isActive);
            setOpen(true);
          }}
          className="gap-1.5 text-xs text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
        >
          <Key size={13} className="text-blue-600" />
          <span>Manage Login / Reset Password</span>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setLoginEmail(contactEmail || "");
            setOpen(true);
          }}
          className="gap-1.5 text-xs shadow-2xs"
        >
          <Key size={13} />
          <span>Enable Portal Login</span>
        </Button>
      )}

      {/* Main Credentials Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={user ? "Manage Staff Credentials" : "Enable Portal Login"}
        description={`${staffName} • ${staffCode}`}
        size="default"
      >
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          {/* Account Status overview */}
          {user && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Current Status:</span>
                <span
                  className={`font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 mt-0.5 ${
                    user.isActive ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                  />
                  {user.isActive ? "Active (Can Login)" : "Disabled (Suspended)"}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleToggleStatus}
                className={
                  user.isActive
                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }
              >
                {user.isActive ? (
                  <>
                    <ShieldAlert size={12} className="text-rose-600" />
                    <span>Disable Login</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Activate Login</span>
                  </>
                )}
              </Button>
            </div>
          )}

          <div>
            <label className={labelClass}>Login Email Address *</label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={inputClass}
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className={labelClass}>
              {user ? "Set New Password *" : "Login Password *"}
            </label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
              {success}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {user ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => setRevokeOpen(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Revoke Login Access
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
              >
                {user ? "Update Password" : "Create Account"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Revoke Confirmation Dialog (Replaces window.confirm) */}
      <ConfirmDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={confirmRevoke}
        title="Revoke Portal Login"
        description={`Are you sure you want to revoke login access for ${staffName}? They will no longer be able to sign in to the Staff Portal. (Their employee profile, attendance, and payroll records will remain safe).`}
        confirmText="Revoke Login"
        confirmTone="danger"
        loading={loading}
      />
    </>
  );
}
