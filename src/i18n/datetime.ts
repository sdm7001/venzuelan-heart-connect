import type { Lang } from "./translations";

const LOCALE_MAP: Record<Lang, string> = {
  en: "en-US",
  es: "es-ES",
};

export function localeFor(lang: Lang): string {
  return LOCALE_MAP[lang] ?? "en-US";
}

/** Full date + time, e.g. "Apr 24, 2026, 6:43 PM" / "24 abr 2026, 18:43" */
export function formatDateTime(value: string | number | Date, lang: Lang): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(lang), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Date only — handy for grouping headers. */
export function formatDate(value: string | number | Date, lang: Lang): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(lang), { dateStyle: "medium" }).format(d);
}

/** Time only. */
export function formatTime(value: string | number | Date, lang: Lang): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeFor(lang), { timeStyle: "short" }).format(d);
}

/** "5 minutes ago" / "hace 5 minutos". Uses Intl.RelativeTimeFormat. */
export function formatRelative(value: string | number | Date, lang: Lang): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const rtf = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: "auto" });
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return "";
}
