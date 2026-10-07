"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { inputClass, labelClass } from "@/lib/form-styles";

type UserData = {
  id: string;
  email: string;
  isActive: boolean;
  roleName: string;
  isMasterAdmin?: boolean;
  staffCode?: string;
  staffName?: string;
};

export function UserRowActions({
  user,
  isCurrentSessionUser,
}: {
  user: UserData;
  isCurrentSessionUser: boolean;
}) {
  const router = useRouter();
  const [editModal, setEditModal] = useState(false);
  const [toggleStatusOpen, setToggleStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user.isActive);

  const isProtectedAdmin = user.isMasterAdmin || isCurrentSessionUser;

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload: { email?: string; password?: string; isActive?: boolean } = {
      email: email.trim().toLowerCase(),
      isActive,
    };

    if (password.trim()) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      payload.password = password;
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to update user credentials");
        return;
      }

      setSuccess("Credentials updated successfully!");
      setTimeout(() => {
        setEditModal(false);
        setPassword("");
        router.refresh();
      }, 700);
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmToggleStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      if (res.ok) {
        setToggleStatusOpen(false);
        router.refresh();
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteOpen(false);
        router.refresh();
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }



  // Master Admin Row is Protected
  if (isProtectedAdmin && user.roleName.toLowerCase().includes("admin")) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          <ShieldCheck size={12} className="text-blue-600" />
          <span>Protected Master</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setEmail(user.email);
            setIsActive(user.isActive);
            setPassword("");
            setEditModal(true);
          }}
          className="h-7 px-2 text-xs"
          title="Change Password"
        >
          <Key size={12} className="text-slate-500" />
          <span>Password</span>
        </Button>

        {/* Change Password Modal for Admin */}
        <Modal
          open={editModal}
          onClose={() => setEditModal(false)}
          title="Update Admin Password"
          description="Update credentials for the primary administrator account."
          size="default"
        >
          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            <div>
              <label className={labelClass}>Login Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>New Password (leave blank to keep current)</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Enter new password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                {success}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} loading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 justify-end">
        {/* Quick Toggle Login Access Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setToggleStatusOpen(true)}
          className={`h-7 px-2.5 text-xs transition ${
            user.isActive
              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
          title={user.isActive ? "Temporarily disable login access" : "Activate portal login"}
        >
          {user.isActive ? (
            <>
              <ShieldAlert size={12} className="text-amber-700" />
              <span className="hidden sm:inline">Disable Access</span>
            </>
          ) : (
            <>
              <ShieldCheck size={12} className="text-emerald-700" />
              <span className="hidden sm:inline">Enable Access</span>
            </>
          )}
        </Button>

        {/* Edit Password Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setEmail(user.email);
            setIsActive(user.isActive);
            setPassword("");
            setEditModal(true);
          }}
          className="h-7 px-2 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
          title="Edit Credentials"
        >
          <Key size={12} className="text-slate-500" />
          <span className="hidden sm:inline">Password</span>
        </Button>

        {/* Delete Login Account Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setDeleteOpen(true)}
          className="h-7 px-2 text-xs text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
          title="Revoke and delete login credentials"
        >
          <Trash2 size={12} className="text-rose-500" />
        </Button>
      </div>

      {/* Edit Credentials Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Update Login Credentials"
        description={`Manage email and password authentication for ${user.email}.`}
        size="default"
      >
        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <div>
            <label className={labelClass}>Login Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              New Password (leave blank to keep current)
            </label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Enter new password to change"
            />
          </div>

          {/* Account Status Switch inside Modal */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">Login Access Status</span>
              <span className="text-slate-500">Allow this employee to authenticate into Staff Portal</span>
            </div>

            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              badge={true}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
              {success}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirmation Dialog (Replaces window.confirm) */}
      <ConfirmDialog
        open={toggleStatusOpen}
        onClose={() => setToggleStatusOpen(false)}
        onConfirm={confirmToggleStatus}
        title={
          user.isActive
            ? user.staffName
              ? `Deactivate Staff Access (${user.staffName})`
              : "Disable Login Access"
            : user.staffName
              ? `Activate Staff Access (${user.staffName})`
              : "Enable Login Access"
        }
        description={
          user.isActive
            ? user.staffName
              ? `Are you sure you want to deactivate login access for ${user.staffName} (${user.staffCode ?? user.email})? Their portal login will be disabled and employee status will be set to inactive. Historical payroll and attendance records will remain safe.`
              : `Are you sure you want to disable login access for '${user.email}'? They will no longer be able to log in to the ERP.`
            : user.staffName
              ? `Are you sure you want to activate login access for ${user.staffName} (${user.staffCode ?? user.email})? They will immediately be able to log into the Staff Portal with their registered credentials.`
              : `Are you sure you want to activate login access for '${user.email}'? They will immediately be able to authenticate.`
        }
        confirmText={user.isActive ? "Deactivate" : "Activate"}
        confirmTone={user.isActive ? "warning" : "default"}
        loading={loading}
      />

      {/* Delete Account Confirmation Dialog (Replaces window.confirm) */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title={user.staffName ? `Revoke Login & Deactivate (${user.staffName})` : "Revoke & Delete Login Account"}
        description={
          user.staffName
            ? `Are you sure you want to revoke portal login credentials for ${user.staffName} (${user.staffCode ?? user.email})? This deletes their login account and deactivates their staff status. Their employee profile, attendance, and payroll records are NOT deleted.`
            : `Are you sure you want to delete the portal login account for '${user.email}'? This removes their authentication credentials.`
        }
        confirmText="Revoke & Deactivate"
        confirmTone="danger"
        loading={loading}
      />
    </>
  );
}
