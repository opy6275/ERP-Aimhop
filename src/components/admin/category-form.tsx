"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";

export function CategoryForm() {
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
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") || ""),
          description: String(fd.get("description") || "") || null,
          status: "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create category");
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
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
        <span>Add category</span>
      </Button>
    );
  }

  const field =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div className="border-b border-slate-100 pb-3">
        <h4 className="text-base font-bold text-slate-900">New Category</h4>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700">Category Name *</label>
        <input name="name" required className={field} placeholder="Category name" />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700">Description</label>
        <input name="description" className={field} placeholder="Description (optional)" />
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          size="sm"
        >
          Save category
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
