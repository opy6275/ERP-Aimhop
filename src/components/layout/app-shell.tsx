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
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const ADMIN_NAV: NavGroup[] = [
  {
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workforce",
    items: [
      { href: "/admin/staff", label: "All Staff", icon: Users },
      { href: "/admin/departments", label: "Departments", icon: Building2 },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/receipts", label: "Receipts", icon: Receipt },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/admin/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: UserIcon },
      { href: "/admin/audit-logs", label: "Activity Logs", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    label: "Employee Portal",
    items: [
      { href: "/app/dashboard", label: "My Dashboard", icon: LayoutDashboard },
      { href: "/app/profile", label: "My Profile", icon: UserIcon },
      { href: "/app/attendance", label: "My Attendance", icon: CalendarCheck },
      { href: "/app/payments", label: "My Payments", icon: CreditCard },
      { href: "/app/receipts", label: "My Receipts", icon: Receipt },
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
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-1">
          {group.label ? (
            <p className="px-3 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
              {group.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
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
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-blue-50/90 text-blue-700 shadow-xs font-semibold"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-colors",
                      active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span>{item.label}</span>
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
    <div className="flex min-h-screen bg-slate-50/60 text-slate-900">
      {/* Sidebar for Desktop — Fixed/Sticky so it never scrolls with page */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:z-40">
        {/* Brand Header */}
        <div className="border-b border-slate-100 px-5 py-4">
          <Link
            href={variant === "admin" ? "/admin/dashboard" : "/app/dashboard"}
            className="group flex items-center gap-3.5 transition"
          >
            <img
              src="/brand-logo.png"
              alt="AimHop Logo"
              className="h-12 w-12 shrink-0 object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  AimHop
                </span>
                <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-2xs">
                  CRM
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                {variant === "admin" ? "Management Console" : "Employee Portal"}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <NavLinks groups={nav} pathname={pathname} />

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-slate-100 p-3.5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-slate-900 to-blue-900 font-mono text-xs font-bold text-white shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{email}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
                <p className="truncate text-[11px] text-slate-500">{roleLabel}</p>
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <img src="/brand-logo.png" alt="AimHop Logo" className="h-10 w-10 shrink-0 object-contain drop-shadow-xs" />
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-slate-900">AimHop</span>
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">CRM</span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden cursor-pointer"
              onClick={() => setOpen(true)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div>
              <span className="text-xs font-medium text-slate-400 hidden sm:inline">Portal / </span>
              <span className="text-sm font-semibold tracking-tight text-slate-800 sm:text-base">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick search command button */}
            <SearchCommand variant={variant} />

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs text-slate-600 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">Operational</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Asia/Kolkata</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
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
