import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";

export default function CookiePolicy() {
  const { t, lang } = useI18n();
  useSeo(
    {
      title: t.legal.cookies,
      description:
        lang === "es"
          ? "Cómo MatchVenezuelan usa cookies y tecnologías similares."
          : "How MatchVenezuelan uses cookies and similar technologies.",
      path: "/legal/cookies",
      lang,
      robots: "index,follow",
    },
    [lang],
  );

  const intro =
    lang === "es"
      ? "Usamos cookies y tecnologías similares para autenticarte de forma segura, recordar tus preferencias, prevenir fraudes y entender cómo se usa la plataforma. Puedes ajustar tus preferencias en cualquier momento desde Preferencias de Consentimiento."
      : "We use cookies and similar technologies to authenticate you securely, remember your preferences, prevent fraud, and understand how the platform is used. You can adjust your preferences at any time from Consent Settings.";

  const categories =
    lang === "es"
      ? [
          { h: "Estrictamente necesarias", b: "Requeridas para iniciar sesión, mantener tu sesión y proteger contra abuso. No se pueden desactivar." },
          { h: "Funcionales", b: "Recuerdan tu idioma, zona horaria y otras preferencias para mejorar tu experiencia." },
          { h: "Analíticas", b: "Nos ayudan a entender qué funciones se usan más, de forma agregada y seudonimizada." },
          { h: "Marketing", b: "Solo con tu consentimiento explícito. Nunca vendemos tus datos a terceros." },
        ]
      : [
          { h: "Strictly necessary", b: "Required to sign you in, keep your session active, and protect against abuse. These cannot be turned off." },
          { h: "Functional", b: "Remember your language, time zone, and other preferences to improve your experience." },
          { h: "Analytics", b: "Help us understand which features are used most, in aggregate and pseudonymized form." },
          { h: "Marketing", b: "Only with your explicit consent. We never sell your data to third parties." },
        ];

  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t.legal.effective ?? t.legal.lastUpdated}: 2026-01-01 · {t.legal.lastUpdated}: 2026-04
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
            {t.legal.cookies}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>

          <div className="mt-12 space-y-10">
            {categories.map((c, i) => (
              <section key={i}>
                <h2 className="font-display text-xl font-semibold text-burgundy md:text-2xl">{c.h}</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{c.b}</p>
              </section>
            ))}
          </div>

          <p className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
            {lang === "es"
              ? "¿Preguntas? Escríbenos a privacy@matchvenezuelan.com."
              : "Questions? Contact us at privacy@matchvenezuelan.com."}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
