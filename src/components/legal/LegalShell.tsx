import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Info, AlertTriangle, ShieldCheck, Sparkles, Scale } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";
import { useI18n } from "@/i18n/I18nProvider";
import heroImg from "@/assets/hero-legal.jpg";

export type LegalCalloutTone = "info" | "warning" | "success" | "important" | "legal";

export type LegalCallout = {
  tone?: LegalCalloutTone;
  title?: string;
  body: string;
};

export type LegalSubsection = {
  heading: string;
  items: string[];
};

export type LegalSection = {
  heading: string;
  /** Short one-line summary shown directly under the heading */
  summary?: string;
  /** Flat bullet items (legacy / simple sections) */
  items?: string[];
  /** Grouped sub-sections with their own subheading */
  subsections?: LegalSubsection[];
  /** Optional emphasized callout displayed at the end of the section */
  callout?: LegalCallout;
};

const CALLOUT_STYLES: Record<LegalCalloutTone, { wrap: string; icon: string; Icon: typeof Info }> = {
  info: {
    wrap: "border-primary/30 bg-primary/5 text-foreground",
    icon: "text-primary",
    Icon: Info,
  },
  warning: {
    wrap: "border-amber-500/40 bg-amber-500/10 text-foreground",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  success: {
    wrap: "border-emerald-500/40 bg-emerald-500/10 text-foreground",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: ShieldCheck,
  },
  important: {
    wrap: "border-burgundy/40 bg-burgundy/5 text-foreground",
    icon: "text-burgundy",
    Icon: Sparkles,
  },
  legal: {
    wrap: "border-border bg-muted/40 text-foreground",
    icon: "text-foreground/70",
    Icon: Scale,
  },
};

function CalloutBlock({ callout, defaultTitle }: { callout: LegalCallout; defaultTitle: string }) {
  const tone = callout.tone ?? "info";
  const { wrap, icon, Icon } = CALLOUT_STYLES[tone];
  return (
    <aside
      role="note"
      className={`mt-5 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${wrap}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon}`} aria-hidden="true" />
      <div>
        <p className="font-semibold tracking-tight">{callout.title ?? defaultTitle}</p>
        <p className="mt-1 text-foreground/80">{callout.body}</p>
      </div>
    </aside>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5 text-base leading-relaxed text-muted-foreground">
      {items.map((it, j) => (
        <li key={j} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalShell({
  title,
  effective,
  lastUpdated,
  intro,
  sections,
  children,
}: {
  title: string;
  effective: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  const { t, lang } = useI18n();
  const isEs = lang === "es";
  const noteLabel = isEs ? "Nota" : "Note";

  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden">
        <ParallaxHeroImage src={heroImg} />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/80 via-burgundy/65 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-3xl text-primary-foreground animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-primary-foreground/80">
              {t.legal.effective}: {effective} · {t.legal.lastUpdated}: {lastUpdated}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">
              {title}
            </h1>
          </div>
        </div>
      </section>

      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>

          <nav
            aria-label={isEs ? "Índice" : "Table of contents"}
            className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 md:p-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isEs ? "Índice del documento" : "Document contents"}
              </p>
              <p className="text-xs text-muted-foreground/80">
                {sections.length} {isEs ? "secciones" : "sections"}
              </p>
            </div>
            <ol className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={`#sec-${i}`}
                    className="text-foreground/85 hover:text-primary hover:underline"
                  >
                    {s.heading.replace(/^\s*\d+\.\s*/, "")}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {children}

          <div className="mt-12 space-y-12">
            {sections.map((s, i) => (
              <section
                key={i}
                id={`sec-${i}`}
                className="scroll-mt-24 border-l-2 border-primary/20 pl-5 md:pl-6"
              >
                <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">
                  {s.heading}
                </h2>
                {s.summary && (
                  <p className="mt-2 text-sm italic text-muted-foreground/90">{s.summary}</p>
                )}

                {s.items && s.items.length > 0 && <BulletList items={s.items} />}

                {s.subsections?.map((sub, k) => (
                  <div key={k} className="mt-6">
                    <h3 className="font-display text-base font-semibold text-foreground md:text-lg">
                      {sub.heading}
                    </h3>
                    <BulletList items={sub.items} />
                  </div>
                ))}

                {s.callout && <CalloutBlock callout={s.callout} defaultTitle={noteLabel} />}
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 text-sm">
            <Link to="/legal/terms" className="text-primary hover:underline">
              {isEs ? "Términos de Servicio" : "Terms of Service"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/legal/privacy" className="text-primary hover:underline">
              {isEs ? "Política de Privacidad" : "Privacy Policy"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/legal/cookies" className="text-primary hover:underline">
              {isEs ? "Política de Cookies" : "Cookie Policy"}
            </Link>
          </div>

          <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
            {isEs
              ? "¿Preguntas? Escríbenos a legal@matchvenezuelan.com."
              : "Questions? Contact us at legal@matchvenezuelan.com."}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
