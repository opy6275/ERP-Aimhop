import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5">
        <div className="flex h-5 items-center">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded-md border border-slate-300 bg-white text-blue-600 transition focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1 accent-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={inputId} className="font-medium text-slate-700 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-slate-500">{description}</p>}
          </div>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
