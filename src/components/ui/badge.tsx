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
  default: "bg-blue-50 text-blue-700 border border-blue-200",
  secondary: "bg-slate-100 text-slate-700 border border-slate-200",
  destructive: "bg-rose-50 text-rose-700 border border-rose-200",
  outline: "border border-slate-200 text-slate-700 bg-white",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-normal transition-colors",
        VARIANT_MAP[variant] || VARIANT_MAP.default,
        className,
      )}
      {...props}
    />
  );
}
