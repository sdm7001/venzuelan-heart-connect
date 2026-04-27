import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useSeo, faqLd, breadcrumbLd, SITE_URL } from "@/seo/seo";
import type { SeoAlternate, JsonLd } from "@/seo/seo";
import type { LandingPageContent } from "@/content/landingPages";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  content: LandingPageContent;
  isEs: boolean;
}

export default function LandingPageTemplate({ content, isEs }: Props) {
  const c = isEs && content.es ? content.es : content;
  const enPath = `/${content.slug}`;
  const esPath = content.esSlug ? `/es/${content.esSlug}` : undefined;
  const canonical = isEs && esPath ? esPath : enPath;
  const lang = isEs ? "es" : "en";

  const alternates: SeoAlternate[] = esPath
    ? [
        { hreflang: "en", href: `${SITE_URL}${enPath}` },
        { hreflang: "es", href: `${SITE_URL}${esPath}` },
        { hreflang: "x-default", href: `${SITE_URL}${enPath}` },
      ]
    : [{ hreflang: "en", href: `${SITE_URL}${enPath}` }];

  const jsonLdBlocks: JsonLd[] = [
    breadcrumbLd([
      { name: isEs ? "Inicio" : "Home", url: isEs ? "/es/" : "/" },
      { name: c.h1, url: canonical },
    ]),
  ];
  if (c.faq && c.faq.length > 0) {
    jsonLdBlocks.push(faqLd(c.faq));
  }

  useSeo(
    {
      title: c.title,
      description: c.description,
      path: canonical,
      lang,
      alternates,
      jsonLd: jsonLdBlocks,
    },
    [lang, content.slug],
  );

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-section px-gutter">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-3 py-1 text-xs font-medium text-burgundy backdrop-blur">
              <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
              {isEs ? "Relaciones Serias" : "Serious Relationships"}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-burgundy text-balance sm:text-4xl md:text-5xl">
              {c.h1}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {c.intro}
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="romance">
                <Link to="/auth?mode=join">
                  {isEs ? "Crear Perfil Gratis" : "Create Your Free Profile"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl space-y-14">
          {c.sections.map((s, i) => (
            <article key={i}>
              <h2 className="font-display text-2xl font-semibold text-burgundy md:text-3xl text-balance">
                {s.heading}
              </h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                {s.body.split("\n\n").map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      {c.faq && c.faq.length > 0 && (
        <section className="bg-card/50 border-t border-border">
          <div className="container py-section px-gutter">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-2xl font-semibold text-burgundy md:text-3xl text-balance">
                {isEs ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
              </h2>
              <Accordion type="single" collapsible className="mt-8">
                {c.faq.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                    <AccordionTrigger className="text-left font-display text-base font-medium text-foreground hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {/* Related Links */}
      {c.relatedLinks.length > 0 && (
        <section className="container py-section px-gutter">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">
              {isEs ? "Explorar Mas" : "Explore More"}
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {c.relatedLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant"
                  >
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="container pb-section px-gutter">
        <div className="relative overflow-hidden rounded-3xl gradient-romance p-card text-center text-primary-foreground shadow-elegant">
          <h3 className="font-display text-2xl font-semibold sm:text-3xl text-balance">
            {isEs
              ? "Comienza Tu Viaje Hoy"
              : "Start Your Journey Today"}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
            {isEs
              ? "Unete a MatchVenezuelan y conecta con personas verificadas que comparten tus valores y metas de relacion."
              : "Join MatchVenezuelan and connect with verified people who share your values and relationship goals."}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/auth?mode=join">
              {isEs ? "Crear Perfil Gratis" : "Create Your Free Profile"}
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
