import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { ShieldCheck, AlertTriangle, Flag, BadgeCheck, MessageCircle, Plane, Ban } from "lucide-react";
import heroImg from "@/assets/hero-safety.jpg";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";

const CONTENT = {
  en: {
    metaTitle: "How to Date Venezuelan Women Safely | Safety Standards at MatchVenezuelan",
    metaDesc:
      "Learn how MatchVenezuelan's moderation system works, how to spot romance scams, how to report suspicious behavior, and what verified profiles actually mean. Safety is the product.",
    sections: [
      {
        icon: ShieldCheck,
        heading: "How our moderation system works",
        body: "Every new profile on MatchVenezuelan enters a review queue before being made visible to other members. Our moderation team manually reviews accounts for signs of impersonation, fake photography, solicitation language, and behavioral patterns consistent with romance scam operation. This is not automated gatekeeping — it is a human process, because no algorithm fully understands the difference between a genuine person and a skilled scammer.\n\nOnce active, profiles continue to be monitored through behavioral signals. If a member sends money requests, moves conversations off-platform unusually quickly, or receives multiple reports, our system flags the account for expedited human review. Accounts confirmed to be operating in bad faith are removed and, where evidence warrants it, reported to relevant authorities. We maintain an audit trail for every moderation decision — accountability is internal policy, not optional.",
      },
      {
        icon: AlertTriangle,
        heading: "Common romance scam red flags",
        body: "Romance scams on international dating platforms follow recognizable patterns. Knowing them protects you.\n\nThe most common red flag is urgency: a scammer will try to move fast, declare strong feelings within days, and push for an exclusive emotional commitment before you have had time to genuinely evaluate the relationship. Genuine people understand that trust takes time.\n\nA second major signal is financial requests. These can be gradual — first a small amount for an emergency, then more for a visa, then more for a medical bill — or direct from the start. MatchVenezuelan's policy is unambiguous: no legitimate partner on this platform will ever need you to send money. If someone asks for money before you have met in person, stop the conversation and report it.\n\nOther red flags include unwillingness to video call, inconsistencies between their profile and their messages, photos that reverse-image-search to unrelated people, and pressure to move to WhatsApp or another platform before any trust has been established.",
      },
      {
        icon: Flag,
        heading: "How reporting works",
        body: "Every conversation, profile, and message on MatchVenezuelan has a visible report button. Reports go directly to our moderation team, not to an automated triage queue. We read every report and respond to safety-related ones within 24 hours.\n\nWhen you report an account, the person you reported is not notified. You can continue to use the platform normally while we review. If our review confirms a violation, the account is removed and you are notified. If we need more information from you, we will contact you directly via your registered email.\n\nReporting is not a last resort — it is a routine part of keeping the community safe. If something feels off, report it. You are not required to be certain. Our team is trained to evaluate ambiguous situations.",
      },
      {
        icon: BadgeCheck,
        heading: "What verification actually means here",
        body: "Verification on MatchVenezuelan is not a single checkbox. We offer five distinct layers: photo verification (a live selfie compared to profile images), social verification (a linked and reviewed social profile), ID verification (a government document reviewed by a human), income verification (for members who want to display financial transparency), and concierge verification (a structured interview with a member of our team).\n\nEach completed layer adds a visible badge to the profile. Badges are not permanent — they are revoked if the underlying evidence is later invalidated or if the account is suspended for other policy violations. More badges indicate a more thoroughly reviewed profile, but they complement your own judgment, not replace it. A verified profile is a meaningfully lower-risk profile. It is not a guarantee.",
      },
      {
        icon: MessageCircle,
        heading: "Tips for safe online communication",
        body: "Keep conversations on the platform until you have established genuine trust. This is the single most protective step you can take. MatchVenezuelan's messaging system is monitored; off-platform conversations are not.\n\nBefore sharing personal contact information, have at least one video call. Seeing someone's face and hearing their voice in real time resolves the most common authenticity doubts quickly. If someone consistently refuses video calls — technical problems that are always mysteriously present — treat that as a serious signal.\n\nDo not share your home address, workplace, financial accounts, or passport information with anyone you have not met in person. Genuine partners understand and respect these boundaries. Scammers push against them.\n\nIf your gut is telling you something is wrong, trust it. You can always block, report, and move on.",
      },
      {
        icon: Plane,
        heading: "Before traveling to meet someone",
        body: "Traveling to meet someone you met online is a significant step that should be taken only after sustained communication — ideally several months of regular contact including multiple video calls. Before you book any travel, you should feel confident about who this person is, what they want, and what you want together.\n\nTell a trusted friend or family member where you are going, who you are meeting, and how to reach you. Share your accommodation address with at least one person who is not your match. Keep copies of your travel documents in a separate location from the originals, and register your travel with your country's embassy or consulate if visiting Venezuela.\n\nFor a first meeting, maintain your own accommodation rather than staying with your match's family — this gives both parties space to adjust and prevents any uncomfortable dynamic if the meeting does not go as hoped. This is not a trust issue; it is a practical standard that most couples who have navigated this successfully recommend.",
      },
      {
        icon: Ban,
        heading: "When to pause and think twice",
        body: "There are specific moments in a relationship where it is worth pausing before acting. The most important one: before sending any money, regardless of how compelling the reason sounds.\n\nOther moments to pause: before moving all communication off-platform permanently, before sharing explicit photos or very personal information with someone you have not met, before making significant financial decisions that involve your match (investing in a business, sending goods, co-signing anything), and before making major life changes based primarily on the relationship's progress.\n\nNone of these are reasons to distrust a partner who has given you no reason for concern. They are prompts to slow down, communicate honestly, and make sure both parties are aligned before irreversible steps are taken. Healthy relationships can withstand patience. Relationships where urgency is being manufactured cannot.",
      },
    ],
  },
  es: {
    metaTitle: "Cómo Salir con una Venezolana con Seguridad | Estándares de MatchVenezuelan",
    metaDesc:
      "Conoce cómo funciona la moderación de MatchVenezuelan, cómo detectar estafas románticas, cómo denunciar comportamientos sospechosos y qué significan realmente los perfiles verificados.",
    sections: [
      {
        icon: ShieldCheck,
        heading: "Cómo funciona nuestro sistema de moderación",
        body: "Cada perfil nuevo en MatchVenezuelan entra en una cola de revisión antes de ser visible para otros miembros. Nuestro equipo de moderación revisa manualmente las cuentas en busca de señales de suplantación de identidad, fotografías falsas, lenguaje de solicitud y patrones de comportamiento consistentes con operaciones de estafa romántica. No es una selección automatizada — es un proceso humano, porque ningún algoritmo comprende completamente la diferencia entre una persona genuina y un estafador habilidoso.\n\nUna vez activos, los perfiles continúan siendo monitoreados a través de señales de comportamiento. Si un miembro envía solicitudes de dinero, mueve conversaciones fuera de la plataforma inusualmente rápido o recibe múltiples denuncias, nuestro sistema marca la cuenta para revisión humana expedita. Las cuentas confirmadas como actuando de mala fe son eliminadas y, cuando la evidencia lo justifica, reportadas a las autoridades correspondientes.",
      },
      {
        icon: AlertTriangle,
        heading: "Señales comunes de estafa romántica",
        body: "Las estafas románticas en plataformas de citas internacionales siguen patrones reconocibles. Conocerlos te protege.\n\nLa señal de alerta más común es la urgencia: un estafador intentará moverse rápido, declarar sentimientos fuertes en días y presionar para un compromiso emocional exclusivo antes de que hayas tenido tiempo de evaluar genuinamente la relación. Las personas genuinas entienden que la confianza lleva tiempo.\n\nUna segunda señal importante son las solicitudes financieras. Estas pueden ser graduales — primero una pequeña cantidad para una emergencia, luego más para una visa, luego más para una factura médica — o directas desde el principio. La política de MatchVenezuelan es inequívoca: ningún compañero legítimo en esta plataforma necesitará que envíes dinero. Si alguien pide dinero antes de que se hayan conocido en persona, detén la conversación y denúncialo.\n\nOtras señales incluyen falta de disposición para videollamadas, inconsistencias entre su perfil y sus mensajes, y presión para mudarse a WhatsApp u otra plataforma antes de establecer cualquier confianza.",
      },
      {
        icon: Flag,
        heading: "Cómo funciona el sistema de denuncias",
        body: "Cada conversación, perfil y mensaje en MatchVenezuelan tiene un botón de denuncia visible. Las denuncias van directamente a nuestro equipo de moderación, no a una cola automatizada. Leemos cada denuncia y respondemos a las relacionadas con seguridad dentro de las 24 horas.\n\nCuando denuncias una cuenta, la persona denunciada no recibe notificación. Puedes continuar usando la plataforma con normalidad mientras revisamos. Si nuestra revisión confirma una violación, la cuenta es eliminada y tú eres notificado. Denunciar no es un último recurso — es una parte rutinaria de mantener la comunidad segura.",
      },
      {
        icon: BadgeCheck,
        heading: "Lo que realmente significa la verificación aquí",
        body: "La verificación en MatchVenezuelan no es una sola casilla. Ofrecemos cinco capas distintas: verificación fotográfica (un selfie en vivo comparado con imágenes del perfil), verificación social (un perfil social vinculado y revisado), verificación de identidad (un documento gubernamental revisado por un humano), verificación de ingresos y verificación por concierge (una entrevista estructurada con un miembro de nuestro equipo).\n\nCada capa completada agrega una insignia visible al perfil. Las insignias no son permanentes — se revocan si la evidencia subyacente se invalida posteriormente. Un perfil verificado es un perfil de riesgo significativamente menor. No es una garantía.",
      },
      {
        icon: MessageCircle,
        heading: "Consejos para una comunicación segura en línea",
        body: "Mantén las conversaciones en la plataforma hasta que hayas establecido confianza genuina. Este es el paso protector más importante que puedes dar. El sistema de mensajería de MatchVenezuelan es monitoreado; las conversaciones fuera de la plataforma no lo son.\n\nAntes de compartir información de contacto personal, ten al menos una videollamada. Ver la cara de alguien y escuchar su voz en tiempo real resuelve rápidamente las dudas de autenticidad más comunes. Si alguien rechaza constantemente las videollamadas — con problemas técnicos siempre misteriosamente presentes — trata eso como una señal seria.\n\nNo compartas tu domicilio, lugar de trabajo, cuentas financieras o información de pasaporte con nadie que no hayas conocido en persona.",
      },
      {
        icon: Plane,
        heading: "Antes de viajar para conocer a alguien",
        body: "Viajar para conocer a alguien que conociste en línea es un paso significativo que solo debe darse después de una comunicación sostenida — idealmente varios meses de contacto regular que incluyan múltiples videollamadas. Antes de reservar cualquier viaje, debes sentirte seguro de quién es esta persona, qué quiere y qué quieren juntos.\n\nDile a un amigo o familiar de confianza a dónde vas, a quién vas a conocer y cómo comunicarse contigo. Para un primer encuentro, mantén tu propio alojamiento en lugar de quedarte con la familia de tu pareja — esto da a ambas partes espacio para adaptarse y evita cualquier dinámica incómoda si el encuentro no resulta como se esperaba.",
      },
      {
        icon: Ban,
        heading: "Cuándo hacer una pausa y pensar dos veces",
        body: "Hay momentos específicos en una relación en los que vale la pena hacer una pausa antes de actuar. El más importante: antes de enviar cualquier dinero, independientemente de cuán convincente suene la razón.\n\nOtros momentos para hacer una pausa: antes de mover toda la comunicación fuera de la plataforma permanentemente, antes de compartir fotos explícitas o información muy personal con alguien que no has conocido, antes de tomar decisiones financieras significativas que involucren a tu pareja, y antes de hacer cambios de vida importantes basados principalmente en el progreso de la relación.\n\nNinguno de estos son razones para desconfiar de una pareja que no te ha dado razón para preocuparte. Son indicadores para reducir la velocidad, comunicarse honestamente y asegurarse de que ambas partes estén alineadas antes de tomar medidas irreversibles.",
      },
    ],
  },
};

export default function Safety() {
  const { t, lang } = useI18n();
  const copy = CONTENT[lang];

  useSeo(
    {
      title: copy.metaTitle,
      titleAbsolute: true,
      description: copy.metaDesc,
      path: lang === "es" ? "/es/safety" : "/safety",
      lang,
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/safety" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/safety" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/safety" },
      ],
    },
    [lang],
  );

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <ParallaxHeroImage src={heroImg} />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/75 via-burgundy/55 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-3xl text-center text-primary-foreground animate-fade-in">
            <span className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> {t.safety.eyebrow}
            </span>
            <h1 className="font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">
              {t.safety.title}
            </h1>
            <p className="mt-4 text-primary-foreground/90 md:text-lg">{t.safety.sub}</p>
          </div>
        </div>
      </section>

      {/* Expanded content sections */}
      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl space-y-12">
          {copy.sections.map((section, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-burgundy">
                  <section.icon className="h-4 w-4" />
                </div>
                <h2 className="font-display text-xl font-semibold text-burgundy">{section.heading}</h2>
              </div>
              <div className="space-y-4 pl-12">
                {section.body.split("\n\n").map((para, j) => (
                  <p key={j} className="text-sm leading-relaxed text-foreground/80">{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-section px-gutter">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-card shadow-card text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h3 className="font-display text-lg font-semibold text-burgundy">
            {lang === "es" ? "¿Tienes una pregunta de seguridad?" : "Have a safety question?"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "es"
              ? "Nuestro equipo de soporte está disponible en ambos idiomas."
              : "Our support team is available in both English and Spanish."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/faq"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              {lang === "es" ? "Ver preguntas frecuentes" : "Read the FAQ"}
            </Link>
            <a
              href="mailto:support@matchvenezuelan.com?subject=Safety%20question"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth"
            >
              {lang === "es" ? "Contactar al equipo" : "Contact our team"}
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
