import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";

type Section = { readonly heading: string; readonly items: readonly string[] };
type Key = "tos" | "privacy" | "aup" | "antiSolicit";

export function LegalPage({ titleKey }: { titleKey: Key }) {
  const { t, lang } = useI18n();

  const titleMap: Record<Key, string> = {
    tos: t.legal.tos,
    privacy: t.legal.privacy,
    aup: t.legal.aup,
    antiSolicit: t.legal.antiSolicit,
  };
  const leadMap: Record<Key, string> = {
    tos: t.legal.tosBody,
    privacy: t.legal.privacyBody,
    aup: t.legal.aupBody,
    antiSolicit: t.legal.antiBody,
  };
  const sectionsMap: Record<Key, readonly Section[]> = {
    tos: t.legal.tosSections,
    privacy: t.legal.privacySections,
    aup: t.legal.aupSections,
    antiSolicit: t.legal.antiSections,
  };
  const pathMap: Record<Key, string> = {
    tos: lang === "es" ? "/es/legal/terms" : "/legal/terms",
    privacy: lang === "es" ? "/es/legal/privacy" : "/legal/privacy",
    aup: "/legal/acceptable-use",
    antiSolicit: "/legal/anti-solicitation",
  };

  const alternatesMap: Partial<Record<Key, { hreflang: string; href: string }[]>> = {
    tos: [
      { hreflang: "en", href: "https://matchvenezuelan.com/legal/terms" },
      { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/terms" },
      { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/terms" },
    ],
    privacy: [
      { hreflang: "en", href: "https://matchvenezuelan.com/legal/privacy" },
      { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/privacy" },
      { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/privacy" },
    ],
  };

  const sections = sectionsMap[titleKey];

  useSeo(
    {
      title: titleMap[titleKey],
      description: leadMap[titleKey].slice(0, 155),
      path: pathMap[titleKey],
      lang,
      robots: "index,follow",
      ...(alternatesMap[titleKey] ? { alternates: alternatesMap[titleKey] } : {}),
    },
    [lang, titleKey],
  );

  return (
    <PublicLayout>
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t.legal.effective}: 2026-01-01 · {t.legal.lastUpdated}: 2026-04
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
            {titleMap[titleKey]}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {leadMap[titleKey]}
          </p>

          {/* Table of contents */}
          <nav
            aria-label={lang === "es" ? "Índice" : "Table of contents"}
            className="mt-10 rounded-2xl border border-border bg-muted/30 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "es" ? "Contenido" : "Contents"}
            </p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#sec-${i}`}
                    className="text-foreground/80 hover:text-primary hover:underline"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="mt-12 space-y-10">
            {sections.map((s, i) => (
              <section key={i} id={`sec-${i}`} className="scroll-mt-24">
                <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">
                  {s.heading}
                </h2>
                <ul className="mt-4 space-y-2.5 text-base leading-relaxed text-muted-foreground">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
            {lang === "es"
              ? "Si algo en este documento no está claro, contáctanos en legal@matchvenezuelan.com."
              : "If anything in this document is unclear, contact us at legal@matchvenezuelan.com."}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

export const Terms = () => <LegalPage titleKey="tos" />;
export const Privacy = () => <LegalPage titleKey="privacy" />;
export const AcceptableUse = () => <LegalPage titleKey="aup" />;
export const AntiSolicitation = () => <LegalPage titleKey="antiSolicit" />;
