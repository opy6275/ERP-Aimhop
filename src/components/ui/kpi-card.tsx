import { cn } from "@/lib/utils";
import React from "react";
import {
  Users,
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
  TrendingUp,
  TrendingDown,
} from "@/components/ui/icons";

export type KpiTone = "default" | "success" | "warning" | "danger" | "primary" | "accent";

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
  }
> = {
  default: {
    border: "border-slate-200/80 hover:border-slate-300",
    value: "text-slate-900",
    iconBg: "bg-slate-100 text-slate-700 border border-slate-200/60",
    iconColor: "text-slate-700",
  },
  primary: {
    border: "border-slate-200/80 hover:border-blue-300",
    value: "text-slate-900",
    iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    iconColor: "text-blue-600",
  },
  accent: {
    border: "border-slate-200/80 hover:border-indigo-300",
    value: "text-slate-900",
    iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    iconColor: "text-indigo-600",
  },
  success: {
    border: "border-slate-200/80 hover:border-emerald-300",
    value: "text-slate-900",
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    iconColor: "text-emerald-600",
  },
  warning: {
    border: "border-slate-200/80 hover:border-amber-300",
    value: "text-slate-900",
    iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
    iconColor: "text-amber-600",
  },
  danger: {
    border: "border-slate-200/80 hover:border-rose-300",
    value: "text-slate-900",
    iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
    iconColor: "text-rose-600",
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
        "relative rounded-xl border bg-white p-5 shadow-2xs transition-colors",
        t.border,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{label}</p>
        {renderedIcon ? (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-2xs",
              t.iconBg,
            )}
          >
            {renderedIcon}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <p className={cn("text-2xl font-bold tracking-tight tabular-nums sm:text-3xl", t.value)}>
          {value}
        </p>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
              trend.positive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100",
            )}
          >
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.label}</span>
          </span>
        ) : null}
      </div>

      {hint ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-normal">
          <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
          <span className="truncate">{hint}</span>
        </div>
      ) : null}
    </div>
  );
}
