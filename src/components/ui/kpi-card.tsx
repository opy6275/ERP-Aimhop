import { cn } from "@/lib/utils";
import React from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  IdCard,
  User,
  IndianRupee,
  Building2,
  CalendarCheck,
  Wallet,
  BarChart3,
  Clock,
  Activity,
  CreditCard,
} from "@/components/ui/icons";

type KpiTone = "default" | "success" | "warning" | "danger" | "primary" | "accent";

function resolveIcon(icon?: React.ReactNode): React.ReactNode {
  if (!icon) return null;
  if (typeof icon === "string") {
    switch (icon.toLowerCase()) {
      case "users":
        return <Users size={18} />;
      case "shield":
        return <ShieldCheck size={18} />;
      case "id-card":
      case "idcard":
        return <IdCard size={18} />;
      case "user":
        return <User size={18} />;
      case "currency":
      case "rupee":
        return <IndianRupee size={18} />;
      case "building":
        return <Building2 size={18} />;
      case "calendar":
        return <CalendarCheck size={18} />;
      case "wallet":
        return <Wallet size={18} />;
      case "chart":
        return <BarChart3 size={18} />;
      case "clock":
        return <Clock size={18} />;
      case "activity":
        return <Activity size={18} />;
      case "credit-card":
        return <CreditCard size={18} />;
      default:
        return null;
    }
  }
  return icon;
}

const TONE_STYLES: Record<
  KpiTone,
  {
    border: string;
    value: string;
    iconBg: string;
    iconColor: string;
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
  }
> = {
  default: {
    border: "border-slate-200/90 hover:border-slate-300",
    value: "text-slate-900",
    iconBg: "bg-slate-100 text-slate-700 border border-slate-200/60",
    iconColor: "text-slate-700",
    bgGradient: "from-white to-slate-50/70",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    glow: "group-hover:shadow-slate-200/50",
  },
  primary: {
    border: "border-blue-200/90 hover:border-blue-400",
    value: "text-blue-950",
    iconBg: "bg-blue-50 text-blue-600 border border-blue-200/60",
    iconColor: "text-blue-600",
    bgGradient: "from-white via-white to-blue-50/40",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    glow: "group-hover:shadow-blue-200/50",
  },
  accent: {
    border: "border-indigo-200/90 hover:border-indigo-400",
    value: "text-indigo-950",
    iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-200/60",
    iconColor: "text-indigo-600",
    bgGradient: "from-white via-white to-indigo-50/40",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    glow: "group-hover:shadow-indigo-200/50",
  },
  success: {
    border: "border-emerald-200/90 hover:border-emerald-400",
    value: "text-emerald-950",
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
    iconColor: "text-emerald-600",
    bgGradient: "from-white via-white to-emerald-50/40",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    glow: "group-hover:shadow-emerald-200/50",
  },
  warning: {
    border: "border-amber-200/90 hover:border-amber-400",
    value: "text-amber-950",
    iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60",
    iconColor: "text-amber-600",
    bgGradient: "from-white via-white to-amber-50/40",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    glow: "group-hover:shadow-amber-200/50",
  },
  danger: {
    border: "border-rose-200/90 hover:border-rose-400",
    value: "text-rose-950",
    iconBg: "bg-rose-50 text-rose-600 border border-rose-200/60",
    iconColor: "text-rose-600",
    bgGradient: "from-white via-white to-rose-50/40",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    glow: "group-hover:shadow-rose-200/50",
  },
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: KpiTone;
  icon?: React.ReactNode;
  trend?: { label: string; positive?: boolean };
  className?: string;
}) {
  const t = TONE_STYLES[tone] ?? TONE_STYLES.default;
  const renderedIcon = resolveIcon(icon);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04),0_8px_16px_-4px_rgba(15,23,42,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        t.border,
        t.bgGradient,
        t.glow,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</p>
        {renderedIcon ? (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-110",
              t.iconBg,
            )}
          >
            {renderedIcon}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <p className={cn("text-2xl font-black tracking-tight tabular-nums sm:text-3xl", t.value)}>
          {value}
        </p>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
              trend.positive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.label}
          </span>
        ) : null}
      </div>

      {hint ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{hint}</span>
        </div>
      ) : null}
    </div>
  );
}
