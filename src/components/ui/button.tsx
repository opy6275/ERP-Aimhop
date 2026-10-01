import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

const VARIANT_MAP: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white shadow-xs hover:bg-blue-700 active:scale-[0.98]",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.98]",
  destructive: "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs",
  ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
  link: "text-blue-600 underline-offset-4 hover:underline",
};

const SIZE_MAP: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 rounded-lg px-3 text-xs font-semibold",
  lg: "h-11 rounded-xl px-8 text-base",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          VARIANT_MAP[variant] || VARIANT_MAP.default,
          SIZE_MAP[size] || SIZE_MAP.default,
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
