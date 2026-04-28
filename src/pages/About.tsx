import { Link } from "react-router-dom";
import { ShieldCheck, Users, Globe2, Heart, BadgeCheck, BookOpen } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo, SITE_URL, SITE_NAME } from "@/seo/seo";
import { Button } from "@/components/ui/button";

const AUTHOR = {
  name: "Valentina Reyes",
  title: {
    en: "Editorial Lead & Cross-Cultural Relationship Researcher",
    es: "Responsable Editorial e Investigadora de Relaciones Interculturales",
  },
  bio: {
    en: "Valentina was born in Caracas and grew up between Maracaibo and the Venezuelan coast. She emigrated to Miami in 2018 and has spent the years since consulting for diaspora support organizations, writing about Venezuelan cultural identity, and researching safety dynamics in international online dating. Her work focuses on helping Venezuelan women navigate cross-cultural relationships with dignity, and helping Western men understand the cultural context they're entering. She leads editorial direction at MatchVenezuelan.",
    es: "Valentina nació en Caracas y creció entre Maracaibo y la costa venezolana. Emigró a Miami en 2018 y desde entonces ha trabajado como consultora para organizaciones de apoyo a la diáspora, escribiendo sobre identidad cultural venezolana e investigando la seguridad en las citas internacionales en línea. Su trabajo se centra en ayudar a las mujeres venezolanas a navegar relaciones interculturales con dignidad, y en ayudar a hombres occidentales a entender el contexto cultural que están ingresando.",
  },
};

const COPY = {
  en: {
    metaTitle: "About MatchVenezuelan | Our Mission, Team, and Trust Standards",
    metaDesc:
      "MatchVenezuelan was built to connect Venezuelan women and Western men through verified, serious-intent dating. Learn about our mission, moderation standards, and the team behind the platform.",
    hero: "Built for one reason.",
    heroSub:
      "There were no serious, safe, bilingual platforms connecting Venezuelan women with genuine partners abroad. We built one.",
    missionTitle: "Our mission",
    mission:
      "MatchVenezuelan exists to make one thing happen: meaningful, committed relationships between Venezuelan women and men worldwide who share serious intentions. We are not a general dating app with a Venezuelan filter. We are a platform built specifically for this community, this culture, and this level of intent.",
    missionP2:
      "Venezuelan women are among the warmest, most family-oriented, and most underserved populations in international dating. For years, the platforms available to them were plagued by fake profiles, transactional dynamics, and cultural misunderstanding. We built MatchVenezuelan to change that — with verified profiles, bilingual design, and a moderation standard that treats safety as the product, not a feature.",
    trustTitle: "How we maintain trust",
    trustItems: [
      {
        icon: BadgeCheck,
        heading: "Multi-layer identity verification",
        body: "Members can complete photo verification, social verification, ID verification, and concierge review. Each layer adds a visible trust badge. Badges are revoked if evidence is later invalidated.",
      },
      {
        icon: ShieldCheck,
        heading: "Active human moderation",
        body: "Our moderation team reviews reports within hours, monitors behavioral signals across the platform, and removes accounts that violate our policies. We maintain audit trails for every moderation decision.",
      },
      {
        icon: Users,
        heading: "Anti-scam and anti-solicitation enforcement",
        body: "Automated pattern detection flags accounts exhibiting known romance-scam behaviors. Solicitation, escort framing, and off-platform money requests result in immediate removal and, where appropriate, reporting to authorities.",
      },
      {
        icon: Globe2,
        heading: "Bilingual by design, not translation",
        body: "English and Spanish are first-class citizens on this platform. Every page, legal document, email, and moderation communication is available in both languages — not machine-translated, but written by people who understand both cultures.",
      },
    ],
    editorialTitle: "Our editorial team",
    editorialSub:
      "The guides, safety resources, and cultural content on MatchVenezuelan are written by people with direct experience — Venezuelan diaspora members, cross-cultural relationship researchers, and safety professionals.",
    platformTitle: "The platform in numbers",
    platformItems: [
      { label: "Verification layers", value: "5" },
      { label: "Languages supported", value: "2" },
      { label: "Moderation SLA", value: "< 24h" },
      { label: "Countries served", value: "30+" },
    ],
    learnMore: "Learn more",
    safetyLink: "Our safety standards",
    howLink: "How it works",
    resourcesLink: "Guides & resources",
    joinCta: "Create your free profile",
  },
  es: {
    metaTitle: "Sobre MatchVenezuelan | Nuestra Misión, Equipo y Estándares de Confianza",
    metaDesc:
      "MatchVenezuelan fue creada para conectar a mujeres venezolanas y hombres occidentales a través de citas verificadas y con intención seria. Conoce nuestra misión, estándares de moderación y el equipo detrás de la plataforma.",
    hero: "Construida por una razón.",
    heroSub:
      "No existían plataformas serias, seguras y bilingües que conectaran a mujeres venezolanas con parejas genuinas en el exterior. Así que creamos una.",
    missionTitle: "Nuestra misión",
    mission:
      "MatchVenezuelan existe para hacer que suceda una sola cosa: relaciones significativas y comprometidas entre mujeres venezolanas y hombres de todo el mundo que comparten intenciones serias. No somos una aplicación de citas general con un filtro venezolano. Somos una plataforma construida específicamente para esta comunidad, esta cultura y este nivel de intención.",
    missionP2:
      "Las mujeres venezolanas se encuentran entre las más cálidas, orientadas a la familia y desatendidas en las citas internacionales. Durante años, las plataformas disponibles para ellas estuvieron plagadas de perfiles falsos, dinámicas transaccionales y malentendidos culturales. Construimos MatchVenezuelan para cambiar eso, con perfiles verificados, diseño bilingüe y estándares de moderación que tratan la seguridad como el producto, no como una característica.",
    trustTitle: "Cómo mantenemos la confianza",
    trustItems: [
      {
        icon: BadgeCheck,
        heading: "Verificación de identidad en múltiples capas",
        body: "Los miembros pueden completar verificación fotográfica, verificación social, verificación de identidad y revisión por concierge. Cada capa agrega una insignia de confianza visible. Las insignias se revocan si la evidencia se invalida posteriormente.",
      },
      {
        icon: ShieldCheck,
        heading: "Moderación humana activa",
        body: "Nuestro equipo de moderación revisa los informes en horas, monitorea señales de comportamiento en toda la plataforma y elimina cuentas que violan nuestras políticas. Mantenemos registros de auditoría para cada decisión de moderación.",
      },
      {
        icon: Users,
        heading: "Aplicación de políticas anti-estafa y anti-solicitud",
        body: "La detección automatizada de patrones marca cuentas que exhiben comportamientos conocidos de estafas románticas. La solicitud, el encuadre como escolta y las solicitudes de dinero fuera de la plataforma resultan en eliminación inmediata.",
      },
      {
        icon: Globe2,
        heading: "Bilingüe por diseño, no por traducción",
        body: "El inglés y el español son ciudadanos de primera clase en esta plataforma. Cada página, documento legal, correo electrónico y comunicación de moderación está disponible en ambos idiomas, escritos por personas que entienden ambas culturas.",
      },
    ],
    editorialTitle: "Nuestro equipo editorial",
    editorialSub:
      "Las guías, recursos de seguridad y contenido cultural en MatchVenezuelan son escritos por personas con experiencia directa: miembros de la diáspora venezolana, investigadores de relaciones interculturales y profesionales de seguridad.",
    platformTitle: "La plataforma en números",
    platformItems: [
      { label: "Capas de verificación", value: "5" },
      { label: "Idiomas admitidos", value: "2" },
      { label: "SLA de moderación", value: "< 24h" },
      { label: "Países atendidos", value: "30+" },
    ],
    learnMore: "Más información",
    safetyLink: "Nuestros estándares de seguridad",
    howLink: "Cómo funciona",
    resourcesLink: "Guías y recursos",
    joinCta: "Crea tu perfil gratis",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Serious-relationship dating platform connecting Venezuelan women and Western men through verified profiles, bilingual design, and human moderation.",
  foundingDate: "2024",
  areaServed: "Worldwide",
  knowsLanguage: ["en", "es"],
  employee: [
    {
      "@type": "Person",
      name: "Valentina Reyes",
      jobTitle: "Editorial Lead & Cross-Cultural Relationship Researcher",
      description:
        "Venezuelan-born writer, diaspora researcher, and bilingual dating safety advocate based in Miami.",
    },
  ],
};

export default function About() {
  const { lang } = useI18n();
  const copy = COPY[lang];

  useSeo(
    {
      title: copy.metaTitle,
      titleAbsolute: true,
      description: copy.metaDesc,
      path: "/about",
      lang,
      alternates: [
        { hreflang: "en", href: `${SITE_URL}/about` },
        { hreflang: "x-default", href: `${SITE_URL}/about` },
      ],
      jsonLd: orgLd,
    },
    [lang],
  );

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero border-b border-border/40">
        <div className="container py-section px-gutter">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-3 py-1 text-xs font-medium text-burgundy backdrop-blur">
              <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
              {lang === "en" ? "About MatchVenezuelan" : "Sobre MatchVenezuelan"}
            </span>
            <h1 className="font-display text-4xl font-semibold text-burgundy text-balance md:text-5xl">
              {copy.hero}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">{copy.heroSub}</p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-burgundy md:text-3xl">
            {copy.missionTitle}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-foreground">{copy.mission}</p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{copy.missionP2}</p>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="container py-section px-gutter">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-burgundy md:text-3xl">
              {copy.trustTitle}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {copy.trustItems.map((item, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-card shadow-card">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-burgundy">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {item.heading}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial team / author */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-burgundy md:text-3xl">
            {copy.editorialTitle}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{copy.editorialSub}</p>

          <div
            className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-card shadow-card sm:flex-row sm:items-start"
            itemScope
            itemType="https://schema.org/Person"
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-soft text-burgundy text-xl font-semibold font-display">
              VR
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-foreground" itemProp="name">
                {AUTHOR.name}
              </p>
              <p className="text-xs text-muted-foreground" itemProp="jobTitle">
                {AUTHOR.title[lang]}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground" itemProp="description">
                {AUTHOR.bio[lang]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="container py-section px-gutter">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-semibold text-burgundy">{copy.platformTitle}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {copy.platformItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card px-4 py-5 text-center shadow-card"
                >
                  <p className="font-display text-3xl font-semibold text-burgundy">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* More links */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/safety">
                <ShieldCheck className="mr-1.5 h-4 w-4" /> {copy.safetyLink}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/how-it-works">{copy.howLink}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/resources">
                <BookOpen className="mr-1.5 h-4 w-4" /> {copy.resourcesLink}
              </Link>
            </Button>
          </div>
          <div className="mt-10 rounded-3xl gradient-romance p-card text-center text-primary-foreground shadow-elegant">
            <h3 className="font-display text-xl font-semibold sm:text-2xl">
              {lang === "en"
                ? "Ready to meet someone real?"
                : "¿Lista para conocer a alguien de verdad?"}
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-primary-foreground/90">
              {lang === "en"
                ? "Free for women. Verified profiles only. No pressure."
                : "Gratis para mujeres. Solo perfiles verificados. Sin presión."}
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/auth?mode=join">{copy.joinCta}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
