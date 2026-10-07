const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatInr(amount: number | string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return Number.isInteger(n) ? inr.format(n) : inrExact.format(n);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function calculateAge(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const birth = typeof d === "string" ? new Date(d) : d;
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function formatDateWithAge(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const formatted = formatDate(d);
  if (formatted === "—") return "—";
  const age = calculateAge(d);
  return age !== null ? `${formatted} (${age} yrs)` : formatted;
}

export function formatMonthLabel(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function startOfMonth(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0, 1));
}

export function parsePeriodMonth(yyyyMm: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return startOfMonth(year, month - 1);
}

export function toDateOnlyUtc(isoOrDate: string | Date) {
  if (typeof isoOrDate === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoOrDate.trim());
    if (m) {
      return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    }
  }
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = Number(parts.find((p) => p.type === "year")?.value ?? d.getUTCFullYear());
  const m = Number(parts.find((p) => p.type === "month")?.value ?? d.getUTCMonth() + 1);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? d.getUTCDate());

  return new Date(Date.UTC(y, m - 1, day));
}

export function decimalToNumber(v: { toString(): string } | number | string) {
  return typeof v === "number" ? v : Number(v.toString());
}
