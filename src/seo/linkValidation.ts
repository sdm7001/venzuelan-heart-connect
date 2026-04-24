// Validation helpers for internal link suggestions.
// Used both when accepting candidates from the post editor and when approving
// suggestions in the review queue. Keep client-side rules in sync with the
// admin RLS policies — these are UX guards, not security guards.

export const ANCHOR_MIN = 3;
export const ANCHOR_MAX = 80;

export type LinkLike = { label: string; href: string };

function normalizeHref(href: string): string {
  return href.trim().toLowerCase().replace(/\/+$/, "");
}

export function validateAnchor(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) return "Anchor text is required.";
  if (trimmed.length < ANCHOR_MIN) return `Anchor text must be at least ${ANCHOR_MIN} characters.`;
  if (trimmed.length > ANCHOR_MAX) return `Anchor text must be ${ANCHOR_MAX} characters or fewer.`;
  return null;
}

export function validateHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return "URL is required.";
  if (trimmed.length > 500) return "URL is too long.";
  // Allow internal paths or absolute http(s) URLs only.
  const isInternal = trimmed.startsWith("/");
  const isAbsolute = /^https?:\/\//i.test(trimmed);
  if (!isInternal && !isAbsolute) return "URL must start with '/' or 'https://'.";
  if (isAbsolute) {
    try { new URL(trimmed); } catch { return "URL is not well-formed."; }
  }
  return null;
}

export function isDuplicateHref(href: string, existing: LinkLike[]): boolean {
  const target = normalizeHref(href);
  return existing.some(l => normalizeHref(l.href ?? "") === target);
}

export type LinkValidationResult = { ok: true } | { ok: false; error: string };

/** Validate one link entry against an existing list (for dedupe). */
export function validateLinkEntry(
  entry: LinkLike,
  existing: LinkLike[] = [],
): LinkValidationResult {
  const anchorErr = validateAnchor(entry.label);
  if (anchorErr) return { ok: false, error: anchorErr };
  const hrefErr = validateHref(entry.href);
  if (hrefErr) return { ok: false, error: hrefErr };
  if (isDuplicateHref(entry.href, existing)) {
    return { ok: false, error: "This URL is already linked from this post." };
  }
  return { ok: true };
}

/**
 * Validate a bilingual accept request. At least one of `en`/`es` must be
 * present. Each present side is checked for anchor length, href format, and
 * duplicates within its own existing list.
 */
export function validateBilingualAccept(input: {
  href: string;
  en?: { label: string; existing: LinkLike[] };
  es?: { label: string; existing: LinkLike[] };
}): LinkValidationResult {
  if (!input.en && !input.es) {
    return { ok: false, error: "Pick at least one language (EN or ES)." };
  }
  const hrefErr = validateHref(input.href);
  if (hrefErr) return { ok: false, error: hrefErr };

  if (input.en) {
    const r = validateLinkEntry({ label: input.en.label, href: input.href }, input.en.existing);
    if (r.ok === false) return { ok: false, error: `EN: ${r.error}` };
  }
  if (input.es) {
    const r = validateLinkEntry({ label: input.es.label, href: input.href }, input.es.existing);
    if (r.ok === false) return { ok: false, error: `ES: ${r.error}` };
  }
  return { ok: true };
}
