import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { UserPlus, BadgeCheck, MessageCircle, Plane, Globe2, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-how-it-works.jpg";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";

const CONTENT = {
  en: {
    metaTitle: "How MatchVenezuelan Works | International Dating, Verification & Safe Meetings",
    metaDesc:
      "A step-by-step guide to how MatchVenezuelan works for both Venezuelan women and Western men — from creating a verified profile to meeting safely in person.",
    steps: {
      title: "The four steps",
      items: [
        {
          icon: UserPlus,
          number: "1",
          title: "Create your profile",
          body: "Tell us who you are, what you're looking for, and your preferred language. Women join and use core features for free. Men browse for free and unlock messaging through a paid tier. During onboarding, every member sets their relationship intent — marriage, a serious long-term relationship, travel and meet, or friendship first — so that expectations are transparent before the first message is ever sent.",
        },
        {
          icon: BadgeCheck,
          number: "2",
          title: "Verify your identity",
          body: "Choose your level of verification: photo verification, social verification, ID verification, income verification, or concierge review. Each completed layer earns a visible trust badge on your profile. More badges signal more thorough vetting and build credibility with potential matches. Verification is not mandatory, but it significantly improves match quality — because both sides of the conversation know who they are talking to.",
        },
        {
          icon: MessageCircle,
          number: "3",
          title: "Connect with intention",
          body: "Browse verified profiles, send introductory messages, and begin conversations with people whose relationship goals align with yours. The platform is fully bilingual — English and Spanish — so language barriers don't prevent genuine connection. Our messaging system is designed for real dialogue, not quick swiping. Every conversation happens within MatchVenezuelan's moderated environment until both parties are ready to move further.",
        },
        {
          icon: Plane,
          number: "4",
          title: "Meet in real life, safely",
          body: "When the relationship is ready, our safety guides help you plan an in-person meeting responsibly. Most couples choose a meeting location that works for both parties — often a city where the Venezuelan partner is already living, or a neutral third location. Our safety resources cover everything from what to tell trusted friends before you travel to how to approach meeting her family.",
        },
      ],
    },
    women: {
      title: "For Venezuelan women",
      body: "Venezuelan women join MatchVenezuelan free of charge and use all core features at no cost — including profile creation, verification, browsing, and messaging. The platform is designed to be safe, private, and respectful. You control what you share, who can contact you, and the pace of every relationship.\n\nMany Venezuelan women on the platform are living abroad — in the United States, Spain, Chile, Colombia, or elsewhere in the diaspora. Others are connecting from Venezuela directly. MatchVenezuelan serves both contexts. Wherever you are, the platform gives you access to verified men from around the world who are specifically seeking Venezuelan partners for committed relationships — not casual encounters.\n\nEvery man on the platform has agreed to our community standards, which prohibit solicitation, explicit requests, and pressure tactics. If anyone violates these standards, reporting is easy and our team responds quickly.",
    },
    men: {
      title: "For men seeking Venezuelan women",
      body: "Men browse MatchVenezuelan's verified profiles for free. Messaging and advanced features are available through a paid subscription — pricing is shown clearly and there are no hidden fees. The subscription model is intentional: it ensures that men who contact women are serious, not browsing casually with no intention of following through.\n\nBefore your first message, your profile should reflect genuine intent. The more complete and honest your profile, the better your matches will be. Venezuelan women on the platform are looking for the same thing you are: someone real, with clear intentions, who respects both the process and the culture they are entering.\n\nCultural context matters. MatchVenezuelan provides guides on Venezuelan dating culture, family dynamics, and communication styles — not to provide a rulebook, but to help you approach the relationship with appropriate understanding.",
    },
    trust: {
      title: "Trust, safety, and moderation",
      body: "Safety is not a feature on MatchVenezuelan — it is the product. Every new profile enters a moderation queue. Active accounts are monitored for behavioral signals. Reports are reviewed by humans, not automated systems, within 24 hours.\n\nVerification at multiple levels — photo, social, ID, and concierge — gives members meaningful signals about who they are talking to. Verified profiles display trust badges that are revoked if evidence is later invalidated.\n\nOur anti-scam system monitors for known romance-scam patterns: money requests, rapid emotional escalation, refusal to video call, and pressure to move off-platform. Accounts flagged by this system are reviewed immediately.",
    },
    bilingual: {
      title: "Bilingual by design",
      body: "English and Spanish are both first-class on this platform. Every page, guide, legal document, email, and moderation message is available in both languages. The bilingual design is not a translation layer — it is a core feature that reflects the reality of Venezuelan-Western relationships, where one partner often feels more comfortable in Spanish and the other in English.\n\nIn-app messages can be written in either language. The platform does not require a common language to start a conversation — it creates the conditions for two people to build one.",
    },
  },
  es: {
    metaTitle: "Cómo Funciona MatchVenezuelan | Citas Internacionales, Verificación y Encuentros Seguros",
    metaDesc:
      "Guía paso a paso de cómo funciona MatchVenezuelan para mujeres venezolanas y hombres occidentales: desde crear un perfil verificado hasta conocerse en persona con seguridad.",
    steps: {
      title: "Los cuatro pasos",
      items: [
        {
          icon: UserPlus,
          number: "1",
          title: "Crea tu perfil",
          body: "Cuéntanos quién eres, qué buscas y tu idioma preferido. Las mujeres se unen y usan las funciones principales de forma gratuita. Los hombres navegan gratis y desbloquean la mensajería a través de una suscripción de pago. Durante el proceso de incorporación, cada miembro establece su intención de relación — matrimonio, una relación seria a largo plazo, viajar y conocerse, o amistad primero — para que las expectativas sean transparentes antes del primer mensaje.",
        },
        {
          icon: BadgeCheck,
          number: "2",
          title: "Verifica tu identidad",
          body: "Elige tu nivel de verificación: verificación fotográfica, social, de identidad, de ingresos o revisión por concierge. Cada capa completada otorga una insignia de confianza visible en tu perfil. Más insignias indican una verificación más exhaustiva. La verificación no es obligatoria, pero mejora significativamente la calidad de las coincidencias, porque ambas partes de la conversación saben con quién están hablando.",
        },
        {
          icon: MessageCircle,
          number: "3",
          title: "Conecta con intención",
          body: "Navega por perfiles verificados, envía mensajes de presentación y comienza conversaciones con personas cuyos objetivos de relación coincidan con los tuyos. La plataforma es completamente bilingüe — inglés y español — para que las barreras idiomáticas no impidan una conexión genuina. Nuestro sistema de mensajería está diseñado para el diálogo real, no para deslizamientos rápidos.",
        },
        {
          icon: Plane,
          number: "4",
          title: "Conócete en persona, con seguridad",
          body: "Cuando la relación esté lista, nuestras guías de seguridad te ayudan a planificar un encuentro en persona de manera responsable. La mayoría de las parejas eligen una ubicación de reunión que funcione para ambas partes — a menudo una ciudad donde la pareja venezolana ya vive, o una tercera ubicación neutral.",
        },
      ],
    },
    women: {
      title: "Para mujeres venezolanas",
      body: "Las mujeres venezolanas se unen a MatchVenezuelan de forma gratuita y usan todas las funciones principales sin costo — incluyendo creación de perfil, verificación, navegación y mensajería. La plataforma está diseñada para ser segura, privada y respetuosa. Tú controlas qué compartes, quién puede contactarte y el ritmo de cada relación.\n\nMuchas venezolanas en la plataforma viven en el exterior — en Estados Unidos, España, Chile, Colombia u otros destinos de la diáspora. Otras se conectan directamente desde Venezuela. MatchVenezuelan sirve a ambos contextos.\n\nCada hombre en la plataforma ha aceptado nuestros estándares comunitarios, que prohíben solicitudes, pedidos explícitos y tácticas de presión. Si alguien viola estas normas, denunciar es fácil y nuestro equipo responde rápidamente.",
    },
    men: {
      title: "Para hombres que buscan venezolanas",
      body: "Los hombres navegan los perfiles verificados de MatchVenezuelan de forma gratuita. La mensajería y las funciones avanzadas están disponibles a través de una suscripción de pago — los precios se muestran claramente y no hay cargos ocultos. El modelo de suscripción es intencional: garantiza que los hombres que contactan a las mujeres sean serios, no navegando casualmente sin intención de seguir adelante.\n\nLas mujeres venezolanas en la plataforma buscan lo mismo que tú: alguien real, con intenciones claras, que respete tanto el proceso como la cultura que está ingresando. MatchVenezuelan proporciona guías sobre cultura de citas venezolana, dinámicas familiares y estilos de comunicación.",
    },
    trust: {
      title: "Confianza, seguridad y moderación",
      body: "La seguridad no es una característica en MatchVenezuelan — es el producto. Cada perfil nuevo entra en una cola de moderación. Las cuentas activas son monitoreadas mediante señales de comportamiento. Los informes son revisados por humanos, no sistemas automatizados, dentro de las 24 horas.\n\nLa verificación en múltiples niveles — fotográfica, social, de identidad y por concierge — da a los miembros señales significativas sobre con quién hablan. Los perfiles verificados muestran insignias de confianza que se revocan si la evidencia se invalida posteriormente.",
    },
    bilingual: {
      title: "Bilingüe por diseño",
      body: "El inglés y el español son ciudadanos de primera clase en esta plataforma. Cada página, guía, documento legal, correo electrónico y mensaje de moderación está disponible en ambos idiomas. El diseño bilingüe no es una capa de traducción — es una función central que refleja la realidad de las relaciones venezolano-occidentales, donde una pareja a menudo se siente más cómoda en español y la otra en inglés.",
    },
  },
};

export default function HowItWorks() {
  const { t, lang } = useI18n();
  const copy = CONTENT[lang];

  useSeo(
    {
      title: copy.metaTitle,
      titleAbsolute: true,
      description: copy.metaDesc,
      path: "/how-it-works",
      lang,
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/how-it-works" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/how-it-works" },
      ],
    },
    [lang],
  );

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <ParallaxHeroImage src={heroImg} />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/70 via-burgundy/55 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-2xl text-center text-primary-foreground animate-fade-in">
            <h1 className="font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">
              {t.how.title}
            </h1>
            <p className="mt-4 text-primary-foreground/90 md:text-lg">{t.how.sub}</p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-semibold text-burgundy md:text-3xl mb-block">
            {copy.steps.title}
          </h2>
          <div className="grid gap-stack md:grid-cols-2">
            {copy.steps.items.map((step) => (
              <div key={step.number} className="rounded-2xl border border-border bg-card p-card shadow-card">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-burgundy">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{step.number} · {step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For women / for men */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="container py-section px-gutter">
          <div className="mx-auto max-w-4xl grid gap-block md:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-burgundy mb-4">{copy.women.title}</h2>
              {copy.women.body.split("\n\n").map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3">{p}</p>
              ))}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-burgundy mb-4">{copy.men.title}</h2>
              {copy.men.body.split("\n\n").map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3">{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust + bilingual */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-4xl grid gap-block md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-card shadow-card">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-burgundy">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">{copy.trust.title}</h2>
            {copy.trust.body.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-2">{p}</p>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-card shadow-card">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-burgundy">
              <Globe2 className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">{copy.bilingual.title}</h2>
            {copy.bilingual.body.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-2">{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container pb-section px-gutter">
        <div className="mx-auto max-w-4xl rounded-3xl gradient-romance p-card text-center text-primary-foreground shadow-elegant">
          <h3 className="font-display text-2xl font-semibold text-balance">
            {lang === "es" ? "¿Lista para comenzar?" : "Ready to get started?"}
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-sm text-primary-foreground/90">
            {lang === "es"
              ? "Gratis para mujeres. Sin trucos. Solo relaciones reales."
              : "Free for women. No gimmicks. Just real relationships."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth?mode=join"
              className="rounded-lg bg-white/90 px-5 py-2.5 text-sm font-semibold text-burgundy hover:bg-white transition-smooth shadow"
            >
              {lang === "es" ? "Crear cuenta gratis" : "Create your free account"}
            </Link>
            <Link
              to="/safety"
              className="rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-white/20 transition-smooth"
            >
              {lang === "es" ? "Ver estándares de seguridad" : "Our safety standards"}
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
