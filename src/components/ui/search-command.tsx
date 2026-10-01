"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  CalendarCheck,
  CreditCard,
  Receipt,
  BarChart3,
  User as UserIcon,
  Activity,
  Settings,
  UserPlus,
} from "@/components/ui/icons";

type SearchOption = {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
};

const ADMIN_SEARCH_ITEMS: SearchOption[] = [
  { id: "dash", title: "Overview Dashboard", category: "Dashboards", href: "/admin/dashboard", icon: LayoutDashboard, hint: "Executive metrics & KPIs" },
  { id: "staff", title: "Staff Directory", category: "Workforce", href: "/admin/staff", icon: Users, hint: "View & manage all employees" },
  { id: "staff-new", title: "Onboard New Employee", category: "Workforce", href: "/admin/staff/new", icon: UserPlus, hint: "Enroll a new staff member" },
  { id: "depts", title: "Departments", category: "Workforce", href: "/admin/departments", icon: Building2, hint: "Department structure & headcounts" },
  { id: "cats", title: "Staff Categories", category: "Workforce", href: "/admin/categories", icon: Tags, hint: "Job roles & bands" },
  { id: "att", title: "Daily Attendance Sheet", category: "Operations", href: "/admin/attendance", icon: CalendarCheck, hint: "Mark and audit daily presence" },
  { id: "pay", title: "Payroll Disbursements", category: "Operations", href: "/admin/payments", icon: CreditCard, hint: "Salary disbursements & payouts" },
  { id: "pay-new", title: "Process Payout", category: "Operations", href: "/admin/payments/new", icon: CreditCard, hint: "Issue individual or batch payments" },
  { id: "rec", title: "Payment Receipts", category: "Operations", href: "/admin/receipts", icon: Receipt, hint: "Official salary & tax receipts" },
  { id: "rep", title: "Financial & HR Reports", category: "Analytics", href: "/admin/reports", icon: BarChart3, hint: "Workforce & payroll analytics" },
  { id: "users", title: "User Accounts & Access", category: "System", href: "/admin/users", icon: UserIcon, hint: "Manage logins, roles & status" },
  { id: "audit", title: "Security Activity Logs", category: "System", href: "/admin/audit-logs", icon: Activity, hint: "Immutable audit trail" },
  { id: "sett", title: "Company Organization Settings", category: "System", href: "/admin/settings", icon: Settings, hint: "Configure address, tax & policies" },
];

const STAFF_SEARCH_ITEMS: SearchOption[] = [
  { id: "s-dash", title: "My Dashboard", category: "Staff Portal", href: "/app/dashboard", icon: LayoutDashboard, hint: "Shift check-in & summary" },
  { id: "s-prof", title: "My Profile", category: "Staff Portal", href: "/app/profile", icon: UserIcon, hint: "View your employment records" },
  { id: "s-att", title: "My Attendance", category: "Staff Portal", href: "/app/attendance", icon: CalendarCheck, hint: "Past shift records & presence" },
  { id: "s-pay", title: "My Payments", category: "Staff Portal", href: "/app/payments", icon: CreditCard, hint: "Salary history & payment status" },
  { id: "s-rec", title: "My Receipts", category: "Staff Portal", href: "/app/receipts", icon: Receipt, hint: "Download official payment slips" },
];

export function SearchCommand({ variant }: { variant: "admin" | "staff" }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const items = variant === "admin" ? ADMIN_SEARCH_ITEMS : STAFF_SEARCH_ITEMS;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.hint && item.hint.toLowerCase().includes(q)),
    );
  }, [items, query]);

  function navigateTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 shadow-2xs transition hover:border-slate-300 hover:bg-slate-100/70 hover:text-slate-900 cursor-pointer"
        aria-label="Open search command"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline font-medium">Quick search…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-2xs">
          <span>⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
            {/* Search Input */}
            <div className="flex items-center border-b border-slate-100 px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-3 shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a destination or action (e.g. Staff, Attendance, Payments)…"
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching destination found.
                </div>
              ) : (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.href)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-blue-50/80 hover:text-blue-900 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-blue-950">
                            {item.title}
                          </p>
                          {item.hint && (
                            <p className="text-xs text-slate-400 group-hover:text-blue-600">
                              {item.hint}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 group-hover:border-blue-200 group-hover:bg-blue-100/50 group-hover:text-blue-700">
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] text-slate-400">
              <span>Press <kbd className="font-mono font-semibold text-slate-600">ESC</kbd> to close</span>
              <span>AimHop CRM Navigation</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
