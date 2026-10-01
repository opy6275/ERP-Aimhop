"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  id: string;
  email: string;
  isActive: boolean;
  roleName: string;
};

export function UserRowActions({ user, isCurrentSessionUser }: { user: UserData; isCurrentSessionUser: boolean }) {
  const router = useRouter();
  const [resetModal, setResetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Could not update status");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");

    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not reset password");
        return;
      }
      alert(`Password for ${user.email} was reset successfully.`);
      setResetModal(false);
      router.refresh();
    } catch {
      setError("Network communication error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (isCurrentSessionUser) {
      alert("You cannot delete your own logged-in account!");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete user account '${user.email}'?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Could not delete user account");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error while deleting user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          disabled={loading || isCurrentSessionUser}
          onClick={handleToggleStatus}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
            user.isActive
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
          title={isCurrentSessionUser ? "Cannot disable current session" : "Toggle status"}
        >
          {user.isActive ? "Deactivate" : "Activate"}
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setResetModal(true);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
        >
          Reset Key
        </button>

        {!isCurrentSessionUser && (
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
            title="Delete user"
          >
            Delete
          </button>
        )}
      </div>

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setResetModal(false)} />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
              <button
                type="button"
                onClick={() => setResetModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Set a new password for <strong className="text-slate-800">{user.email}</strong>:
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  New Password *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
