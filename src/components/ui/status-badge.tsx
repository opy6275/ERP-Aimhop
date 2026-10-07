import { cn } from "@/lib/utils";

const STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500 ring-emerald-100",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400 ring-slate-200",
  },
  present: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500 ring-emerald-100",
  },
  absent: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500 ring-rose-100",
  },
  leave: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500 ring-amber-100",
  },
  half_day: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500 ring-orange-100",
  },
  holiday: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500 ring-sky-100",
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500 ring-emerald-100",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500 ring-amber-100",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500 ring-emerald-100",
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500 ring-rose-100",
  },
};

export function StatusBadge({
  value,
  className,
  showDot = true,
}: {
  value: string;
  className?: string;
  showDot?: boolean;
}) {
  const normalized = value.toLowerCase();
  const style = STYLES[normalized] ?? {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400 ring-slate-100",
  };
  const label = value.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize tracking-normal transition-colors",
        style.bg,
        style.text,
        style.border,
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full ring-2 shrink-0",
            style.dot,
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
