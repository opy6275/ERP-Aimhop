import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

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
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: PageAction[];
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        {breadcrumbs?.length ? (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-300">/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-800 transition">
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
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>

      {actions?.length ? (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions.map((a, i) => {
            const variantCls =
              a.variant === "secondary"
                ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
                : a.variant === "danger"
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-xs shadow-rose-200"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs shadow-blue-200";

            const btnCls = cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer",
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
        </div>
      ) : null}
    </div>
  );
}
