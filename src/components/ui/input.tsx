import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border bg-white px-3 py-1.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          error
            ? "border-rose-300 focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20"
            : "border-slate-200 hover:border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
