import { Link } from "react-router-dom";
import { Heart, ShieldCheck, Globe2, Sparkles, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo, SITE_NAME, SITE_URL } from "@/seo/seo";
import StructuredData from "@/components/StructuredData";
// TODO: Replace hero-portrait.jpg with a compressed WebP (<150KB) for Core Web Vitals.
import heroImg from "@/assets/hero-portrait.jpg";

export default function Home() {
  const { t, lang } = useI18n();
  const isEs = lang === "es";
  useSeo(
    {
      title: isEs
        ? "MatchVenezuelan — Citas serias con mujeres venezolanas"
        : "MatchVenezuelan — Venezuelan Dating Site for Serious Relationships",
      titleAbsolute: true,
      description: isEs
        ? "Conecta con mujeres venezolanas tradicionales y orientadas a la familia en una plataforma segura y bilingüe para relaciones serias y matrimonio."
        : "Meet traditional, family-oriented Venezuelan women in a safe, bilingual dating platform built for serious relationships and marriage.",
      path: isEs ? "/es/" : "/",
      lang,
      type: "website",
      alternates: [
        { hreflang: "en", href: `${SITE_URL}/` },
        { hreflang: "es", href: `${SITE_URL}/es/` },
        { hreflang: "x-default", href: `${SITE_URL}/` },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/resources?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    },
    [lang],
  );
  return (
    <PublicLayout>
      {!isEs && <StructuredData />}
      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container grid gap-block py-section md:grid-cols-2 md:items-center">
          <div className="flex flex-col justify-center animate-fade-in">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-3 py-1 text-xs font-medium text-burgundy backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {t.hero.eyebrow}
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-burgundy text-balance md:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="romance"><Link to="/auth?mode=join">{t.hero.ctaPrimary}</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/how-it-works">{t.hero.ctaSecondary}</Link></Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-md sm:grid-cols-3 sm:gap-4">
              <TrustChip icon={<ShieldCheck className="h-4 w-4" />} label={t.hero.trustA} />
              <TrustChip icon={<Users className="h-4 w-4" />} label={t.hero.trustB} />
              <TrustChip icon={<Globe2 className="h-4 w-4" />} label={t.hero.trustC} />
            </div>
          </div>
          <div className="relative animate-fade-in-slow">
            <div className="absolute -inset-6 rounded-[2rem] gradient-romance opacity-30 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] shadow-elegant ring-1 ring-primary/10">
              <img src={heroImg} alt="Western man and Venezuelan woman embracing" className="h-full w-full object-cover" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-card/85 p-3 backdrop-blur-md ring-1 ring-border">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Heart className="h-4 w-4" fill="currentColor" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{t.brand.name}</div>
                  <div className="text-xs text-muted-foreground">{t.brand.tagline}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="container py-section">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-burgundy md:text-4xl text-balance">{t.home.pillarsTitle}</h2>
          <p className="mt-4 text-muted-foreground">{t.home.pillarsSub}</p>
        </div>
        <div className="mt-block grid gap-stack md:grid-cols-2 lg:grid-cols-4">
          <Pillar icon={<ShieldCheck />} title={t.home.p1Title} body={t.home.p1Body} />
          <Pillar icon={<Lock />} title={t.home.p2Title} body={t.home.p2Body} />
          <Pillar icon={<Sparkles />} title={t.home.p3Title} body={t.home.p3Body} />
          <Pillar icon={<Globe2 />} title={t.home.p4Title} body={t.home.p4Body} />
        </div>
      </section>

      {/* Explore Guides */}
      <section className="container py-section">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-burgundy md:text-4xl text-balance">
            {isEs ? "Guias para Empezar" : "Explore Our Guides"}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {isEs
              ? "Aprende mas sobre la cultura venezolana, la seguridad en linea y como construir una relacion significativa."
              : "Learn more about Venezuelan culture, online safety, and how to build a meaningful relationship."}
          </p>
        </div>
        <div className="mx-auto mt-block grid max-w-4xl gap-stack sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: isEs ? "Conocer Mujeres Venezolanas" : "Meet Venezuelan Women",
              href: isEs ? "/es/conocer-mujeres-venezolanas" : "/meet-venezuelan-women",
            },
            {
              label: isEs ? "Sitio de Citas Venezolanas" : "Venezuelan Dating Site",
              href: isEs ? "/es/sitio-de-citas-venezolanas" : "/venezuelan-dating-site",
            },
            {
              label: isEs ? "Mujeres para Matrimonio" : "Venezuelan Women for Marriage",
              href: isEs ? "/es/mujeres-venezolanas-para-matrimonio" : "/venezuelan-women-for-marriage",
            },
            {
              label: isEs ? "Citas con Seguridad" : "Dating in Venezuela Safely",
              href: isEs ? "/es/citas-en-venezuela-con-seguridad" : "/dating-in-venezuela-safely",
            },
            {
              label: isEs ? "Valores Familiares" : "Venezuelan Family Values",
              href: isEs ? "/es/valores-familiares-venezolanas" : "/venezuelan-women-family-values",
            },
            {
              label: isEs ? "Por Que Mujeres Venezolanas" : "Why Venezuelan Women",
              href: isEs ? "/es/por-que-mujeres-venezolanas" : "/why-venezuelan-women",
            },
          ].map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-sm font-medium text-foreground shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <Heart className="h-4 w-4 shrink-0 text-primary" />
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-section">
        <div className="relative overflow-hidden rounded-3xl gradient-romance p-card text-center text-primary-foreground shadow-elegant sm:px-10 md:px-16">
          <h3 className="font-display text-2xl font-semibold sm:text-3xl md:text-4xl text-balance">{t.home.ctaTitle}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">{t.home.ctaSub}</p>
          <Button asChild size="lg" variant="secondary" className="mt-7"><Link to="/auth?mode=join">{t.hero.ctaPrimary}</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-xl border border-border bg-card/60 p-3 backdrop-blur">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
    </div>
  );
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-burgundy [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
