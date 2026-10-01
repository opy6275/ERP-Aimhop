import { cn } from "@/lib/utils";
import React from "react";

export function DataTable({
  headers,
  children,
  className,
  caption,
}: {
  headers: (string | React.ReactNode)[];
  children: React.ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_rgba(15,23,42,0.02)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-5 py-3.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90 bg-white font-normal text-slate-800">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Td({
  children,
  className,
  mono,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap transition-colors",
        mono && "font-mono tabular-nums",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
