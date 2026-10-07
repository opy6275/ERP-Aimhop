import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";
import { ChevronRight } from "@/components/ui/icons";

export type PageAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  actionNode,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: PageAction[];
  actionNode?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        {breadcrumbs?.length ? (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-800 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>

      {(actions?.length || actionNode) ? (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions?.map((a, i) => {
            const variantCls =
              a.variant === "secondary"
                ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                : a.variant === "danger"
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-2xs"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs";

            const btnCls = cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              variantCls,
            );

            if (a.href) {
              return (
                <Link key={i} href={a.href} className={btnCls}>
                  {a.icon}
                  <span>{a.label}</span>
                </Link>
              );
            }
            return (
              <button key={i} type="button" onClick={a.onClick} className={btnCls}>
                {a.icon}
                <span>{a.label}</span>
              </button>
            );
          })}
          {actionNode}
        </div>
      ) : null}
    </div>
  );
}
