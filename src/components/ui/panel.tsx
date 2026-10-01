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
        "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_rgba(15,23,42,0.02)] transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                {icon}
              </div>
            ) : null}
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
              {displaySubtitle ? <p className="text-xs text-slate-500">{displaySubtitle}</p> : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-6">{children}</div>
    </div>
  );
}
