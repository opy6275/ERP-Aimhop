"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Receipt,
  BarChart3,
  User as UserIcon,
  Activity,
  Settings,
  LogOut,
} from "@/components/ui/icons";
import { SearchCommand } from "@/components/ui/search-command";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const ADMIN_NAV: NavGroup[] = [
  {
    items: [{ href: "/admin/dashboard", label: "Executive Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workforce",
    items: [
      { href: "/admin/staff", label: "Staff Roster", icon: Users },
      { href: "/admin/departments", label: "Departments", icon: Building2 },
      { href: "/admin/categories", label: "Categories & Roles", icon: Tags },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/attendance", label: "Daily Attendance", icon: CalendarCheck },
      { href: "/admin/leaves", label: "Leave Requests", icon: CalendarDays },
      { href: "/admin/payments", label: "Disbursements", icon: CreditCard },
      { href: "/admin/receipts", label: "Payment Receipts", icon: Receipt },
    ],
  },
  {
    label: "Intelligence",
    items: [{ href: "/admin/reports", label: "Analytics & Reports", icon: BarChart3 }],
  },
  {
    label: "System & Governance",
    items: [
      { href: "/admin/users", label: "User Access", icon: UserIcon },
      { href: "/admin/audit-logs", label: "Audit Stream", icon: Activity },
      { href: "/admin/settings", label: "Company Settings", icon: Settings },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    label: "Employee Self-Service",
    items: [
      { href: "/app/dashboard", label: "My Hub", icon: LayoutDashboard },
      { href: "/app/profile", label: "My Profile", icon: UserIcon },
      { href: "/app/attendance", label: "My Attendance", icon: CalendarCheck },
      { href: "/app/leaves", label: "Leave Requests", icon: CalendarDays },
      { href: "/app/payments", label: "Salary & Payouts", icon: CreditCard },
      { href: "/app/receipts", label: "Salary Slips", icon: Receipt },
    ],
  },
];

type AppShellProps = {
  title: string;
  email: string;
  roleLabel: string;
  variant: "admin" | "staff";
  children: React.ReactNode;
};

function NavLinks({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-5">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-1.5">
          {group.label ? (
            <p className="px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              {group.label}
            </p>
          ) : null}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  item.href !== "/app/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-colors",
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-200",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ title, email, roleLabel, variant, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = variant === "admin" ? ADMIN_NAV : STAFF_NAV;

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900">
      {/* Sidebar for Desktop — Deep Enterprise Obsidian Luxury Style */}
      <aside className="hidden w-68 shrink-0 border-r border-slate-800/80 bg-[#0c1322] md:sticky md:top-0 md:flex md:h-screen md:flex-col md:z-40 text-slate-200 shadow-xl">
        {/* Brand Header */}
        <div className="border-b border-slate-800/90 px-5 py-4.5">
          <Link
            href={variant === "admin" ? "/admin/dashboard" : "/app/dashboard"}
            className="group flex items-center gap-3.5 transition"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-slate-800 p-1 border border-blue-500/30 shadow-md">
              <img
                src="/brand-logo.png"
                alt="AimHop Logo"
                className="h-9 w-9 object-contain drop-shadow transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  AimHop
                </span>
                <span className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                  ERP
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">
                {variant === "admin" ? "Enterprise Console" : "Employee Portal"}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <NavLinks groups={nav} pathname={pathname} />

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-slate-800/90 p-3.5 bg-[#090f1b]/70">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/80 p-2.5 shadow-inner">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-mono text-xs font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-pulse"></span>
                <p className="truncate text-[10px] font-medium text-slate-400 uppercase tracking-wider">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0c1322] text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <img src="/brand-logo.png" alt="AimHop Logo" className="h-10 w-10 shrink-0 object-contain drop-shadow-xs" />
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white">AimHop</span>
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">ERP</span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <NavLinks groups={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Main Content View */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Header with SearchCommand */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden cursor-pointer"
              onClick={() => setOpen(true)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline uppercase tracking-wider">
                {variant === "admin" ? "Management" : "Staff"} /
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Quick search command button */}
            <SearchCommand variant={variant} />

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95 cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
