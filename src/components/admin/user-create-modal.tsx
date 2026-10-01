"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RoleOpt = { id: string; name: string };
type StaffOpt = { id: string; staffCode: string; fullName: string };

export function UserCreateModal({ roles, staff }: { roles: RoleOpt[]; staff: StaffOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
      roleId: String(fd.get("roleId") || ""),
      staffId: String(fd.get("staffId") || "") || null,
      isActive: fd.get("isActive") === "on",
    };

    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not create user account");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network communication error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add User Account</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Create New User Account</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Login Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. finance@aimhop.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Initial Password *</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Security Role *</label>
                <select name="roleId" required className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select Role…
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Link to Staff Profile (Optional)</label>
                <select name="staffId" className={inputClass} defaultValue="">
                  <option value="">None (Standalone Operator / Admin)</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.staffCode} — {s.fullName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Required if assigning Staff role for employee portal self-service.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  id="user-active-checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="user-active-checkbox" className="text-xs font-semibold text-slate-700">
                  Enable Account Immediately (Active)
                </label>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Creating Account…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
