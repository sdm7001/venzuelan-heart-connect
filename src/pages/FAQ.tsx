import { useEffect, useMemo, useRef, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo, faqLd } from "@/seo/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { LifeBuoy, Mail } from "lucide-react";

const SUPPORT_EMAIL = "support@matchvenezuelan.com";

type CtaKind = "safety" | "billing" | "privacy" | "verification" | "account" | "general" | "none";

type CategoryKey = "about" | "verification" | "messaging" | "safety" | "billing" | "privacy";

// Index → category mapping. EN and ES entries are positionally aligned, so a
// single map drives both languages. If you add a new entry, add its category
// here too (or it will fall through to "about").
const ENTRY_CATEGORIES: CategoryKey[] = [
  "about",        // 0  escort/sugar/adult?
  "about",        // 1  who can join
  "billing",      // 2  free for women
  "about",        // 3  languages
  "verification", // 4  how do you verify
  "verification", // 5  trust badges meaning
  "messaging",    // 6  how does messaging work
  "safety",       // 7  how do I report
  "messaging",    // 8  after block/report
  "safety",       // 9  prevent romance scams
  "safety",       // 10 will anyone ask for money
  "billing",      // 11 how do gifts work
  "billing",      // 12 credits & subscriptions
  "billing",      // 13 cancel / delete account
  "privacy",      // 14 private photos
  "privacy",      // 15 personal data
  "safety",       // 16 meeting in person
  "about",        // 17 incomplete onboarding
  "about",        // 18 multiple accounts
  "about",        // 19 contact support
];

// Per-entry CTA. Defaults to the entry's category when omitted; "none" hides
// the CTA (e.g. for the "how do I contact support" entry itself).
const ENTRY_CTAS: Partial<Record<number, CtaKind>> = {
  4: "verification",
  5: "verification",
  6: "account",       // messaging questions go to account support
  8: "safety",        // post-block/report follow-up is a safety matter
  13: "account",      // cancel / delete account
  17: "account",      // onboarding stuck
  18: "account",      // duplicate accounts
  19: "none",         // already explains how to contact support
};

const CATEGORY_ORDER: CategoryKey[] = [
  "about",
  "verification",
  "messaging",
  "safety",
  "billing",
  "privacy",
];

export default function FAQ() {
  const { t, lang } = useI18n();
  const entries = t.faq.entries;
  const categoryLabels = t.faq.categories;

  useSeo(
    {
      title: t.faq.title,
      description: t.faq.intro.slice(0, 155),
      path: "/faq",
      lang,
      jsonLd: faqLd(entries.map((e) => ({ q: e.q, a: e.a }))),
    },
    [lang],
  );

  // Group entries by category, preserving original order within each group.
  const grouped = useMemo(() => {
    const g = new Map<CategoryKey, { entry: { q: string; a: string }; idx: number }[]>();
    entries.forEach((entry, idx) => {
      const cat = ENTRY_CATEGORIES[idx] ?? "about";
      const arr = g.get(cat) ?? [];
      arr.push({ entry, idx });
      g.set(cat, arr);
    });
    return CATEGORY_ORDER
      .filter((c) => g.has(c) && (g.get(c) ?? []).length > 0)
      .map((c) => ({ key: c, label: categoryLabels[c], items: g.get(c)! }));
  }, [entries, categoryLabels]);

  // Scroll-spy: highlight the TOC item for whichever section is in view.
  const [active, setActive] = useState<CategoryKey | null>(grouped[0]?.key ?? null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the section closest to the top that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace(/^faq-/, "") as CategoryKey;
          setActive(id);
        }
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0.01 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [grouped]);

  function jumpTo(key: CategoryKey) {
    const el = document.getElementById(`faq-${key}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(key);
  }

  return (
    <PublicLayout>
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
            {t.faq.title}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t.faq.intro}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label={t.faq.tocTitle}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.faq.tocTitle}
              </p>
              {/* Mobile: horizontal chips. Desktop: vertical list. */}
              <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {grouped.map(({ key, label, items }) => {
                  const isActive = active === key;
                  return (
                    <li key={key}>
                      <button
                        onClick={() => jumpTo(key)}
                        className={cn(
                          "group flex w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left text-sm transition-colors lg:rounded-md lg:border-0 lg:border-l-2 lg:px-3 lg:py-2",
                          isActive
                            ? "border-primary bg-primary/15 text-foreground lg:border-primary lg:bg-primary/10"
                            : "border-border bg-card text-muted-foreground hover:text-foreground lg:border-transparent lg:bg-transparent lg:hover:border-border",
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <span className="truncate">{label}</span>
                        <span
                          className={cn(
                            "ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums",
                            isActive && "bg-primary/20 text-foreground",
                          )}
                        >
                          {items.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Categorized accordions */}
          <div className="space-y-12">
            {grouped.map(({ key, label, items }) => (
              <section
                key={key}
                id={`faq-${key}`}
                ref={(el) => {
                  sectionRefs.current[`faq-${key}`] = el;
                }}
                className="scroll-mt-24"
              >
                <header className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-3">
                  <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">
                    {label}
                  </h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {items.length}
                  </span>
                </header>
                <Accordion type="single" collapsible>
                  {items.map(({ entry, idx }) => {
                    const explicit = ENTRY_CTAS[idx];
                    const ctaKind: CtaKind =
                      explicit ?? (ENTRY_CATEGORIES[idx] as CtaKind) ?? "general";
                    const cta =
                      ctaKind === "none" ? null : t.faq.supportCtas[ctaKind] ?? t.faq.supportCtas.general;
                    const mailto = cta
                      ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(cta.subject)}`
                      : null;
                    const tone =
                      ctaKind === "safety"
                        ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                        : ctaKind === "billing"
                          ? "border-amber-500/30 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                          : "border-burgundy/30 bg-burgundy/5 text-burgundy hover:bg-burgundy/10";
                    return (
                      <AccordionItem
                        key={idx}
                        value={`item-${idx}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="text-left font-display text-base font-medium text-foreground hover:no-underline">
                          {entry.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          <p>{entry.a}</p>
                          {cta && mailto && (
                            <div className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3">
                              {ctaKind === "safety" ? (
                                <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                              ) : (
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                              )}
                              <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {t.faq.stillNeedHelp}
                                </span>
                                <a
                                  href={mailto}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                    tone,
                                  )}
                                >
                                  {cta.label}
                                </a>
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
