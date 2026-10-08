"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const ShellContext = createContext<boolean>(false);

function resolveTitle(pathname: string, variant: "admin" | "staff", customTitle?: string): string {
  if (customTitle) return customTitle;
  if (variant === "admin") {
    if (pathname === "/admin/dashboard") return "Dashboard";
    if (pathname === "/admin/staff") return "Staff Directory";
    if (pathname === "/admin/staff/new") return "Onboard Staff";
    if (pathname.includes("/admin/staff/") && pathname.endsWith("/edit")) return "Edit Staff";
    if (pathname.startsWith("/admin/staff/")) return "Staff Profile";
    if (pathname === "/admin/departments") return "Departments";
    if (pathname === "/admin/categories") return "Categories";
    if (pathname === "/admin/attendance") return "Attendance Roster";
    if (pathname === "/admin/leaves") return "Leave Management";
    if (pathname === "/admin/holidays") return "Company Holidays";
    if (pathname === "/admin/payments") return "Disbursement Ledger";
    if (pathname === "/admin/payments/new") return "Record Payment";
    if (pathname === "/admin/receipts") return "Payment Receipts";
    if (pathname === "/admin/reports") return "Analytics & Reports";
    if (pathname === "/admin/users") return "Login Access Management";
    if (pathname === "/admin/audit-logs") return "Audit Logs";
    if (pathname === "/admin/settings") return "System Settings";
    return "Admin Portal";
  } else {
    if (pathname === "/app/dashboard") return "Dashboard";
    if (pathname === "/app/profile") return "My Profile";
    if (pathname === "/app/attendance") return "Attendance";
    if (pathname === "/app/leaves") return "Leaves";
    if (pathname === "/app/payments") return "Payments";
    if (pathname === "/app/receipts") return "Receipts";
    return "Staff Portal";
  }
}
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
  Menu,
  X,
  ChevronRight,
} from "@/components/ui/icons";
import { SearchCommand } from "@/components/ui/search-command";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";

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
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workforce",
    items: [
      { href: "/admin/staff", label: "Staff", icon: Users },
      { href: "/admin/departments", label: "Departments", icon: Building2 },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/admin/leaves", label: "Leaves", icon: CalendarDays },
      { href: "/admin/holidays", label: "Holidays", icon: CalendarDays },
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
      { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/profile", label: "Profile", icon: UserIcon },
      { href: "/app/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/app/leaves", label: "Leaves", icon: CalendarDays },
      { href: "/app/payments", label: "Payments", icon: CreditCard },
      { href: "/app/receipts", label: "Receipts", icon: Receipt },
    ],
  },
];

type AppShellProps = {
  title?: string;
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
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
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
                  prefetch={true}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-colors",
                        active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
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
  const isInsideShell = useContext(ShellContext);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = variant === "admin" ? ADMIN_NAV : STAFF_NAV;
  const pageTitle = resolveTitle(pathname, variant, title);

  // Body scroll lock on mobile drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // If already rendered inside an outer persistent AppShell layout, pass through children
  if (isInsideShell) {
    return <>{children}</>;
  }

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
    <ShellContext.Provider value={true}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar for Desktop — Clean Light Modern Enterprise Style */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:z-40 text-slate-800">
        {/* Brand Header */}
        <div className="border-b border-slate-200 px-5 py-4">
          <Link
            href={variant === "admin" ? "/admin/dashboard" : "/app/dashboard"}
            className="group flex items-center gap-3 transition"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 p-1 border border-blue-100">
              <Image
                src="/brand-logo.png"
                alt="AimHop Logo"
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  AimHop
                </span>
                <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 uppercase">
                  ERP
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 truncate">
                {variant === "admin" ? "Admin Portal" : "Staff Portal"}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <NavLinks groups={nav} pathname={pathname} />

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-slate-200 p-3.5 bg-slate-50/50">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{email}</p>
              <p className="truncate text-[11px] text-slate-500 capitalize">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-white text-slate-800 shadow-xl border-r border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 p-1 border border-blue-100">
                  <Image
                    src="/brand-logo.png"
                    alt="AimHop Logo"
                    width={28}
                    height={28}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900">AimHop</span>
                  <span className="rounded bg-blue-50 border border-blue-200 px-1 py-0.2 text-[9px] font-bold text-blue-700 uppercase">
                    ERP
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks groups={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="border-t border-slate-200 p-3 bg-slate-50/50">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-700">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{email}</p>
                  <p className="truncate text-[10px] text-slate-500 capitalize">{roleLabel}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main Content View */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Clean Enterprise Header */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden cursor-pointer"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                {variant === "admin" ? "Management" : "Staff Portal"}
              </span>
              <ChevronRight size={14} className="text-slate-300 hidden sm:inline" />
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick search command button */}
            <SearchCommand variant={variant} />

            {/* In-app Notification Bell */}
            <NotificationBell variant={variant} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 cursor-pointer"
              aria-label="Sign out of AimHop ERP"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
    </ShellContext.Provider>
  );
}
