import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";
import { useI18n } from "@/i18n/I18nProvider";
import heroImg from "@/assets/hero-legal.jpg";

export type LegalSection = { heading: string; items: string[] };

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
            aria-label={lang === "es" ? "Índice" : "Table of contents"}
            className="mt-10 rounded-2xl border border-border bg-muted/30 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "es" ? "Contenido" : "Contents"}
            </p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#sec-${i}`} className="text-foreground/80 hover:text-primary hover:underline">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {children}

          <div className="mt-12 space-y-10">
            {sections.map((s, i) => (
              <section key={i} id={`sec-${i}`} className="scroll-mt-24">
                <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">{s.heading}</h2>
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

          <div className="mt-12 flex flex-wrap gap-3 text-sm">
            <Link to="/legal/terms" className="text-primary hover:underline">
              {lang === "es" ? "Términos de Servicio" : "Terms of Service"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/legal/privacy" className="text-primary hover:underline">
              {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/legal/cookies" className="text-primary hover:underline">
              {lang === "es" ? "Política de Cookies" : "Cookie Policy"}
            </Link>
          </div>

          <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
            {lang === "es"
              ? "¿Preguntas? Escríbenos a legal@matchvenezuelan.com."
              : "Questions? Contact us at legal@matchvenezuelan.com."}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
