import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          error
            ? "border-rose-300 focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20"
            : "border-slate-200 hover:border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
