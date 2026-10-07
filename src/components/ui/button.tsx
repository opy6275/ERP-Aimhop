import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "@/components/ui/icons";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm";

const VARIANT_MAP: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white shadow-2xs hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400",
  destructive: "bg-rose-600 text-white shadow-2xs hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-600",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs focus-visible:ring-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
  link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto font-medium focus-visible:ring-blue-600",
};

const SIZE_MAP: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm rounded-lg",
  sm: "h-8 px-3 text-xs rounded-md",
  lg: "h-10 px-6 text-sm rounded-lg font-semibold",
  icon: "h-9 w-9 p-0 rounded-lg shrink-0",
  "icon-sm": "h-8 w-8 p-0 rounded-md shrink-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          VARIANT_MAP[variant] || VARIANT_MAP.default,
          SIZE_MAP[size] || SIZE_MAP.default,
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
