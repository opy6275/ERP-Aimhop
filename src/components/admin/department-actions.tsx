"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeptData = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  staffCount: number;
};

export function DepartmentActions({ department }: { department: DeptData }) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      code: String(fd.get("code") || "") || null,
      description: String(fd.get("description") || "") || null,
      status: String(fd.get("status") || "active"),
    };

    try {
      const res = await fetch(`/api/v1/admin/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not update department");
        return;
      }
      setIsEditOpen(false);
      router.refresh();
    } catch {
      setError("Network communication error");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (department.staffCount > 0) {
      alert(
        `Cannot delete '${department.name}' because ${department.staffCount} employee(s) are assigned to it. Please reassign them first.`,
      );
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete the department '${department.name}'?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/departments/${department.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || "Could not delete department");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error while deleting department");
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1";

  return (
    <>
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsEditOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>

        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {deleting ? "…" : "Delete"}
        </button>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Edit Department</h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onUpdate} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Department Name *</label>
                <input name="name" required defaultValue={department.name} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Short Code (e.g. ENG, HR)</label>
                <input name="code" defaultValue={department.code || ""} className={`${inputClass} font-mono uppercase`} />
              </div>

              <div>
                <label className={labelClass}>Operational Status</label>
                <select name="status" defaultValue={department.status} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Description / Scope</label>
                <textarea name="description" rows={2} defaultValue={department.description || ""} className={inputClass} />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
