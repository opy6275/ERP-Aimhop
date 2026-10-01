import { cn } from "@/lib/utils";
import React from "react";

type KpiTone = "default" | "success" | "warning" | "danger" | "primary" | "accent";

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
  }
> = {
  default: {
    border: "border-slate-200/80 hover:border-slate-300",
    value: "text-slate-900",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    bgGradient: "from-white via-white to-slate-50/50",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
  },
  primary: {
    border: "border-blue-200/80 hover:border-blue-300",
    value: "text-blue-950",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    bgGradient: "from-white via-white to-blue-50/30",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  accent: {
    border: "border-indigo-200/80 hover:border-indigo-300",
    value: "text-indigo-950",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    bgGradient: "from-white via-white to-indigo-50/30",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
  },
  success: {
    border: "border-emerald-200/80 hover:border-emerald-300",
    value: "text-emerald-950",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    bgGradient: "from-white via-white to-emerald-50/30",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
  },
  warning: {
    border: "border-amber-200/80 hover:border-amber-300",
    value: "text-amber-950",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    bgGradient: "from-white via-white to-amber-50/30",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  danger: {
    border: "border-rose-200/80 hover:border-rose-300",
    value: "text-rose-950",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    bgGradient: "from-white via-white to-rose-50/30",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
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

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_rgba(15,23,42,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]",
        t.border,
        t.bgGradient,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
        {icon ? (
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110", t.iconBg, t.iconColor)}>
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className={cn("text-2xl font-bold tracking-tight tabular-nums sm:text-3xl", t.value)}>
          {value}
        </p>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
              trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            )}
          >
            {trend.label}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
