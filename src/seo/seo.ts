// Centralized SEO framework — manages document head: title, description,
// canonical, hreflang, OpenGraph, Twitter cards, and JSON-LD structured data.
//
// Usage:
//   useSeo({ title, description, path, image, type, jsonLd, alternates })
//
// All inserted/updated tags are tracked with data-seo="managed" so we can
// safely diff and remove stale ones on each update.

import { useEffect } from "react";
import type { Lang } from "@/i18n/translations";

export const SITE_NAME = "MatchVenezuelan";
export const SITE_URL = "https://matchvenezuelan.com";
export const DEFAULT_OG_IMAGE = "/logo.png";
export const TWITTER_HANDLE = "@matchvenezuelan";

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export type SeoAlternate = { hreflang: string; href: string };

export type SeoOptions = {
  /** Page title (will be suffixed with site name unless titleAbsolute=true). */
  title: string;
  titleAbsolute?: boolean;
  description: string;
  /** Path-only ("/resources/foo") or absolute URL. Used for canonical + og:url. */
  path?: string;
  /** Active UI language. */
  lang: Lang;
  /** OG image path or URL. Defaults to DEFAULT_OG_IMAGE. */
  image?: string;
  /** OG type. Defaults to "website". */
  type?: "website" | "article" | "profile";
  /** Robots directive. Defaults to "index,follow". */
  robots?: string;
  /** hreflang alternates. Defaults to en/es/x-default pointing to canonical. */
  alternates?: SeoAlternate[];
  /** RSS/Atom feed alternates exposed via <link rel="alternate" type="application/rss+xml">. */
  feeds?: { title: string; href: string; type?: string }[];
  /** One or more JSON-LD blocks. Each gets a unique <script> tag. */
  jsonLd?: JsonLd | JsonLd[];
  /** Article-only metadata. */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
    authorName?: string;
  };
};

const SEO_ATTR = "data-seo";
const SEO_VAL = "managed";
const JSONLD_PREFIX = "seo-jsonld-";

function origin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}

function absUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return origin();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = origin().replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(SEO_ATTR, SEO_VAL);
    document.head.appendChild(el);
  } else {
    el.setAttribute(SEO_ATTR, SEO_VAL);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  const selectorExtra = extra
    ? Object.entries(extra)
        .map(([k, v]) => `[${k}="${v}"]`)
        .join("")
    : "";
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]${selectorExtra}`,
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    el.setAttribute(SEO_ATTR, SEO_VAL);
    document.head.appendChild(el);
  } else {
    el.setAttribute(SEO_ATTR, SEO_VAL);
  }
  el.setAttribute("href", href);
}

function clearManagedJsonLd() {
  document
    .querySelectorAll(`script[${SEO_ATTR}="${SEO_VAL}"][type="application/ld+json"]`)
    .forEach((n) => n.parentNode?.removeChild(n));
}

function setJsonLd(blocks: JsonLd[]) {
  clearManagedJsonLd();
  blocks.forEach((data, i) => {
    const el = document.createElement("script");
    el.id = `${JSONLD_PREFIX}${i}`;
    el.type = "application/ld+json";
    el.setAttribute(SEO_ATTR, SEO_VAL);
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  });
}

function clearManagedAlternates() {
  document
    .querySelectorAll(
      `link[rel="alternate"][${SEO_ATTR}="${SEO_VAL}"]`,
    )
    .forEach((n) => n.parentNode?.removeChild(n));
}

export function applySeo(opts: SeoOptions) {
  if (typeof document === "undefined") return;

  const url = absUrl(opts.path);
  const title = opts.titleAbsolute
    ? opts.title
    : `${opts.title} · ${SITE_NAME}`;
  const image = absUrl(opts.image ?? DEFAULT_OG_IMAGE);
  const ogLocale = opts.lang === "es" ? "es_ES" : "en_US";
  const inLanguage = opts.lang === "es" ? "es-ES" : "en-US";

  document.title = title;
  document.documentElement.lang = opts.lang;

  setMeta("name", "description", opts.description);
  setMeta("name", "robots", opts.robots ?? "index,follow");

  // OpenGraph
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", opts.description);
  setMeta("property", "og:type", opts.type ?? "website");
  setMeta("property", "og:url", url);
  setMeta("property", "og:image", image);
  setMeta("property", "og:locale", ogLocale);
  setMeta(
    "property",
    "og:locale:alternate",
    opts.lang === "en" ? "es_ES" : "en_US",
  );

  // Twitter
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:site", TWITTER_HANDLE);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", opts.description);
  setMeta("name", "twitter:image", image);

  // Article-specific OG
  if (opts.article) {
    if (opts.article.publishedTime)
      setMeta("property", "article:published_time", opts.article.publishedTime);
    if (opts.article.modifiedTime)
      setMeta("property", "article:modified_time", opts.article.modifiedTime);
    if (opts.article.section)
      setMeta("property", "article:section", opts.article.section);
    if (opts.article.authorName)
      setMeta("property", "article:author", opts.article.authorName);
    (opts.article.tags ?? []).forEach((t) =>
      setMeta("property", "article:tag", t),
    );
  }

  // Canonical (no hreflang attr — distinct from alternates)
  setLink("canonical", url);

  // hreflang alternates — clear & rewrite each call
  clearManagedAlternates();
  const alternates: SeoAlternate[] =
    opts.alternates ?? [
      { hreflang: "en", href: url },
      { hreflang: "es", href: url },
      { hreflang: "x-default", href: url },
    ];
  alternates.forEach((alt) =>
    setLink("alternate", alt.href, { hreflang: alt.hreflang }),
  );

  // RSS/Atom feed alternates
  (opts.feeds ?? []).forEach((f) =>
    setLink("alternate", f.href, {
      type: f.type ?? "application/rss+xml",
      title: f.title,
    }),
  );

  // JSON-LD: merge with site-wide Organization block
  const orgLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absUrl(DEFAULT_OG_IMAGE),
  };
  const provided = Array.isArray(opts.jsonLd)
    ? (opts.jsonLd as JsonLd[])
    : opts.jsonLd
      ? [opts.jsonLd]
      : [];
  // Tag every JSON-LD with inLanguage if not already set.
  const enriched = provided.map((b) => {
    if (Array.isArray(b)) return b;
    if (b && typeof b === "object" && !("inLanguage" in b)) {
      return { ...b, inLanguage };
    }
    return b;
  });
  setJsonLd([orgLd, ...enriched]);
}

export function useSeo(opts: SeoOptions, deps: unknown[] = []) {
  useEffect(() => {
    applySeo(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.length ? deps : [opts.title, opts.description, opts.path, opts.lang]);
}

/** Helper: build a BlogPosting JSON-LD object. */
export function blogPostingLd(p: {
  title: string;
  description: string;
  url: string;
  lang: Lang;
  publishedAt?: string;
  modifiedAt?: string;
  section?: string;
  tags?: string[];
  image?: string;
  author?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    inLanguage: p.lang === "es" ? "es-ES" : "en-US",
    datePublished: p.publishedAt,
    dateModified: p.modifiedAt ?? p.publishedAt,
    articleSection: p.section,
    keywords: p.tags?.join(", "),
    image: p.image ? absUrl(p.image) : absUrl(DEFAULT_OG_IMAGE),
    mainEntityOfPage: p.url,
    author: { "@type": "Organization", name: p.author ?? SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absUrl(DEFAULT_OG_IMAGE) },
    },
  };
}

/** Helper: build a FAQPage JSON-LD object. */
export function faqLd(items: { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Helper: build a BreadcrumbList JSON-LD object. */
export function breadcrumbLd(crumbs: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absUrl(c.url),
    })),
  };
}
