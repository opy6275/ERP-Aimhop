import Link from "next/link";
import React from "react";
import { FileText } from "@/components/ui/icons";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string; onClick?: () => void };
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-2xs">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 mb-3.5">
        {icon || <FileText size={20} />}
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">{description}</p>
      {action ? (
        action.href ? (
          <Link
            href={action.href}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 cursor-pointer"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 cursor-pointer"
          >
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}
