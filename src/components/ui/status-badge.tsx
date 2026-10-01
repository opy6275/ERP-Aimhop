import { cn } from "@/lib/utils";

const STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  active: {
    bg: "bg-emerald-50/90",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500 ring-emerald-200",
  },
  inactive: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400 ring-slate-100",
  },
  present: {
    bg: "bg-emerald-50/90",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500 ring-emerald-200",
  },
  absent: {
    bg: "bg-rose-50/90",
    text: "text-rose-700",
    border: "border-rose-200/80",
    dot: "bg-rose-500 ring-rose-200",
  },
  leave: {
    bg: "bg-amber-50/90",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500 ring-amber-200",
  },
  half_day: {
    bg: "bg-orange-50/90",
    text: "text-orange-700",
    border: "border-orange-200/80",
    dot: "bg-orange-500 ring-orange-200",
  },
  holiday: {
    bg: "bg-sky-50/90",
    text: "text-sky-700",
    border: "border-sky-200/80",
    dot: "bg-sky-500 ring-sky-200",
  },
  paid: {
    bg: "bg-emerald-50/90",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500 ring-emerald-200",
  },
  pending: {
    bg: "bg-amber-50/90",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500 ring-amber-200",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize tracking-wide transition-all shadow-xs",
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
      {label}
    </span>
  );
}
