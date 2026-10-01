import Link from "next/link";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-white px-6 py-14 text-center">
      <p className="text-base font-semibold text-[var(--color-foreground)]">{title}</p>
      <p className="mt-1 max-w-md text-sm text-[var(--color-muted)]">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
