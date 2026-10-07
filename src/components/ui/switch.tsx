"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  description?: string;
  badge?: boolean;
  className?: string;
  size?: "sm" | "default";
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      id,
      label,
      description,
      badge = false,
      className,
      size = "default",
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;

    const isSm = size === "sm";

    return (
      <div className={cn("inline-flex items-center gap-3 select-none", className)}>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  "cursor-pointer font-semibold text-slate-800",
                  isSm ? "text-xs" : "text-sm",
                  disabled && "cursor-not-allowed opacity-60",
                )}
                onClick={() => !disabled && onCheckedChange(!checked)}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-[11px] text-slate-500 font-normal">
                {description}
              </span>
            )}
          </div>
        )}

        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            isSm ? "h-5 w-9" : "h-6 w-11",
            checked ? "bg-blue-600" : "bg-slate-300 hover:bg-slate-400/80",
          )}
        >
          <span className="sr-only">{label || "Toggle"}</span>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
              isSm ? "h-4 w-4" : "h-5 w-5",
              checked
                ? isSm
                  ? "translate-x-4"
                  : "translate-x-5"
                : "translate-x-0",
            )}
          />
        </button>

        {badge && (
          <span
            className={cn(
              "inline-flex items-center rounded-md font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 border transition-colors",
              checked
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-600 border-slate-200",
            )}
          >
            {checked ? "Active" : "Disabled"}
          </span>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";
