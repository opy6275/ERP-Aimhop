import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "@/components/ui/icons";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 py-1.5 text-sm text-slate-900 transition-colors focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer",
            error
              ? "border-rose-300 focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20"
              : "border-slate-200 hover:border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      </div>
    );
  },
);
Select.displayName = "Select";
