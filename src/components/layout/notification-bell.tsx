"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CalendarDays,
  Clock,
  CreditCard,
  Sparkles,
  Info,
  X,
} from "@/components/ui/icons";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell({ variant = "admin" }: { variant?: "admin" | "staff" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/v1/notifications", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  }

  function renderIcon(type: string) {
    switch (type) {
      case "leave":
        return <CalendarDays size={15} className="text-amber-600" />;
      case "attendance":
        return <Clock size={15} className="text-blue-600" />;
      case "payment":
        return <CreditCard size={15} className="text-emerald-600" />;
      case "holiday":
        return <Sparkles size={15} className="text-purple-600" />;
      default:
        return <Info size={15} className="text-slate-600" />;
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) {
            handleMarkAllRead();
          }
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs"
        aria-label="View notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition cursor-pointer"
                >
                  <Check size={12} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-500">No new notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You are completely caught up!
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-slate-50/80 ${
                      !n.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                      {renderIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                );

                return n.linkUrl ? (
                  <Link
                    key={n.id}
                    href={n.linkUrl}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>

          {/* Footer quick link */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-500">
            {variant === "admin" ? (
              <Link
                href="/admin/attendance?tab=requests"
                onClick={() => setOpen(false)}
                className="font-semibold text-blue-600 hover:underline"
              >
                Review Pending Approvals →
              </Link>
            ) : (
              <Link
                href="/app/leaves"
                onClick={() => setOpen(false)}
                className="font-semibold text-blue-600 hover:underline"
              >
                View Leave Status →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
