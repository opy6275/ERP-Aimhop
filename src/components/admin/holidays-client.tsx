"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CalendarDays, Sparkles, X, Check, Search } from "@/components/ui/icons";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export type HolidayItem = {
  id: string;
  name: string;
  dateStr: string;
  type: string;
  description?: string | null;
};

export function HolidaysClient({ initialHolidays }: { initialHolidays: HolidayItem[] }) {
  const router = useRouter();
  const [holidays, setHolidays] = useState<HolidayItem[]>(initialHolidays);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    date: new Date().toISOString().slice(0, 10),
    type: "festival",
    description: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const json = await res.json();
        const newH: HolidayItem = {
          id: json.data.id,
          name: json.data.name,
          dateStr: json.data.date.slice(0, 10),
          type: json.data.type,
          description: json.data.description,
        };
        setHolidays((prev) => [...prev, newH].sort((a, b) => a.dateStr.localeCompare(b.dateStr)));
        setOpenAddModal(false);
        setForm({
          name: "",
          date: new Date().toISOString().slice(0, 10),
          type: "festival",
          description: "",
        });
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add holiday");
      }
    } catch {
      alert("Network error while adding holiday");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove "${name}" from company holidays?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHolidays((prev) => prev.filter((h) => h.id !== id));
        router.refresh();
      } else {
        alert("Failed to delete holiday");
      }
    } catch {
      alert("Network error while deleting holiday");
    }
  }

  const filtered = holidays.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.dateStr.includes(q) || (h.description || "").toLowerCase().includes(q);
  });

  function getTypeBadge(type: string) {
    switch (type) {
      case "national":
        return <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-800 uppercase">National</span>;
      case "festival":
        return <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 uppercase">Festival</span>;
      default:
        return <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 uppercase">{type}</span>;
    }
  }

  return (
    <>
      <Panel
        title="Official Holiday Schedule"
        subtitle="Dates marked below are treated as recognized paid holidays on muster roll and payroll."
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search holiday..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-44 sm:w-56 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenAddModal(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
            >
              <Plus size={14} />
              <span>Add Holiday</span>
            </Button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CalendarDays size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No holidays match your criteria</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &apos;Add Holiday&apos; to schedule a company holiday.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((h) => {
              const d = new Date(h.dateStr);
              const dayName = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(d);
              const monthName = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(d);
              const yearNum = d.getFullYear();
              const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div
                  key={h.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    isPast
                      ? "border-slate-200/70 bg-slate-50/50 opacity-80"
                      : "border-slate-200 bg-white shadow-2xs hover:border-blue-300 hover:shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 leading-none">
                            {dayName}
                          </span>
                          <span className="text-sm font-black text-slate-900 leading-tight">
                            {d.getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{h.name}</h4>
                          <span className="text-xs text-slate-400 font-medium">
                            {monthName}, {yearNum}
                          </span>
                        </div>
                      </div>
                      {getTypeBadge(h.type)}
                    </div>

                    {h.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.description}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Paid Holiday
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id, h.name)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                      title="Remove Holiday"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Add Holiday Modal */}
      {openAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <CalendarDays size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add Company Holiday</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali, Eid, Republic Day"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="festival">Festival Observance</option>
                    <option value="national">National Holiday</option>
                    <option value="gazetted">Gazetted / Public</option>
                    <option value="company">Company Specific</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Office closed · Paid festival leave"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  loading={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Save Holiday
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
