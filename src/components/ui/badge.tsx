import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "ghost";

const VARIANT_MAP: Record<BadgeVariant, string> = {
  default: "bg-blue-600 text-white shadow-xs hover:bg-blue-700",
  secondary: "bg-slate-100 text-slate-800 border border-slate-200/80 hover:bg-slate-200",
  destructive: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
  outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        VARIANT_MAP[variant] || VARIANT_MAP.default,
        className,
      )}
      {...props}
    />
  );
}
