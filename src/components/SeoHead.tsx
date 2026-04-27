// SeoHead — declarative SEO component that drives the document <head>.
// Wraps the existing applySeo engine so pages can use either the hook
// (useSeo) or this component interchangeably.

import { useEffect } from "react";
import { applySeo, SITE_URL } from "@/seo/seo";
import type { Lang } from "@/i18n/translations";

type SeoHeadProps = {
  title?: string;
  description?: string;
  /** Path portion only, e.g. "/" or "/es/faq". Used to build the canonical URL. */
  canonicalPath?: string;
  lang?: Lang;
  /** Absolute URLs for each language variant. x-default falls back to the en URL. */
  alternates?: { en?: string; es?: string };
};

export default function SeoHead({
  title,
  description,
  canonicalPath,
  lang = "en",
  alternates,
}: SeoHeadProps) {
  useEffect(() => {
    const alts = alternates
      ? [
          ...(alternates.en ? [{ hreflang: "en", href: alternates.en }] : []),
          ...(alternates.es ? [{ hreflang: "es", href: alternates.es }] : []),
          {
            hreflang: "x-default",
            href: alternates.en ?? alternates.es ?? `${SITE_URL}${canonicalPath ?? "/"}`,
          },
        ]
      : undefined;

    applySeo({
      title: title ?? "",
      description: description ?? "",
      path: canonicalPath,
      lang,
      ...(alts ? { alternates: alts } : {}),
    });
  }, [title, description, canonicalPath, lang, alternates]);

  return null;
}
