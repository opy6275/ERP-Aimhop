"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "@/components/ui/icons";

export function DepartmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/v1/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: String(fd.get("code") || "") || null,
          name: String(fd.get("name") || ""),
          description: String(fd.get("description") || "") || null,
          status: "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create department");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
      >
        <Plus size={16} />
        <span>Add department</span>
      </button>
    );
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs"
    >
      <div className="border-b border-slate-100 pb-3">
        <h4 className="text-base font-bold text-slate-900">Create New Department</h4>
        <p className="text-xs text-slate-500">Add an operational division or business team</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Code</label>
          <input name="code" className={field} placeholder="e.g. ENG" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name *</label>
          <input name="name" required className={field} placeholder="e.g. Engineering" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
        <input name="description" className={field} placeholder="Brief department description" />
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Creating…" : "Save department"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
