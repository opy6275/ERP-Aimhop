import { cn } from "@/lib/utils";
import React from "react";

export function Panel({
  children,
  className,
  title,
  subtitle,
  description,
  action,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const displaySubtitle = subtitle || description;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-2xs transition-colors",
        className,
      )}
    >
      {title ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
                {icon}
              </div>
            ) : null}
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
              {displaySubtitle ? <p className="text-xs text-slate-500 mt-0.5">{displaySubtitle}</p> : null}
            </div>
          </div>
          {action ? <div className="shrink-0 self-end sm:self-auto">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}
