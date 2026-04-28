import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Info, Lock, ShieldCheck, BarChart3, Settings2, Megaphone } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import heroImg from "@/assets/hero-legal.jpg";

type CategoryKey = "necessary" | "functional" | "analytics" | "marketing";

type Prefs = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type StoredPrefs = Prefs & {
  /** Language the user was using when they last saved their choice. */
  lang: "en" | "es";
  /** ISO timestamp of the last save. */
  updatedAt: string;
  /** Schema version, allows future migrations. */
  v: 1;
};

const STORAGE_KEY = "mv:consent-prefs";
const DEFAULT_PREFS: Prefs = { necessary: true, functional: true, analytics: false, marketing: false };

function loadStored(): StoredPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs> & Partial<Prefs>;
    return {
      v: 1,
      necessary: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      lang: parsed.lang === "es" ? "es" : "en",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

type Category = {
  key: CategoryKey;
  Icon: typeof Lock;
  iconClass: string;
  title: string;
  oneLiner: string;
  weUse: string[];
  ifOff: string;
  retention: string;
  legalBasis: string;
  required?: boolean;
};

function buildCategories(isEs: boolean): Category[] {
  return isEs
    ? [
        {
          key: "necessary",
          Icon: Lock,
          iconClass: "text-burgundy",
          required: true,
          title: "Estrictamente necesarias",
          oneLiner: "Permiten iniciar sesión, mantener tu cuenta segura y que el sitio funcione.",
          weUse: [
            "Token de sesión y mantenimiento de inicio de sesión.",
            "Protección CSRF y mitigación básica de bots/abuso.",
            "Recordar tu elección de consentimiento (esta misma página).",
            "Procesar pagos de forma segura (Stripe, cuando lo uses).",
          ],
          ifOff: "El sitio no puede funcionar sin estas cookies, por eso no se pueden desactivar.",
          retention: "Sesión o hasta 12 meses.",
          legalBasis: "Ejecución del contrato e interés legítimo (no requieren consentimiento).",
        },
        {
          key: "functional",
          Icon: Settings2,
          iconClass: "text-primary",
          title: "Funcionales (preferencias)",
          oneLiner: "Recuerdan tus elecciones para que no tengas que repetirlas en cada visita.",
          weUse: [
            "Idioma (EN/ES) y zona horaria.",
            "Modo claro/oscuro y filtros de búsqueda guardados.",
            "Si ya cerraste un banner o aviso para no volver a mostrarlo.",
          ],
          ifOff: "Tendrás que volver a elegir idioma, filtros y otras preferencias en cada visita.",
          retention: "Hasta 12 meses.",
          legalBasis: "Tu consentimiento (en la UE/Reino Unido).",
        },
        {
          key: "analytics",
          Icon: BarChart3,
          iconClass: "text-primary",
          title: "Analíticas",
          oneLiner: "Nos ayudan a entender, de forma agregada, cómo se usa el producto para mejorarlo.",
          weUse: [
            "Páginas visitadas y funciones usadas (sin nombres ni mensajes).",
            "Tiempos de carga y errores para detectar problemas.",
            "Tipo de dispositivo, navegador e idioma del navegador.",
          ],
          ifOff: "El producto sigue funcionando igual; simplemente vemos menos señales para mejorarlo.",
          retention: "Hasta 14 meses, datos seudonimizados.",
          legalBasis: "Tu consentimiento (en la UE/Reino Unido); interés legítimo en otras jurisdicciones.",
        },
        {
          key: "marketing",
          Icon: Megaphone,
          iconClass: "text-primary",
          title: "Marketing",
          oneLiner: "Solo si decides recibir comunicaciones promocionales personalizadas.",
          weUse: [
            "Medir si llegaste desde una campaña concreta (UTM, referrer).",
            "Personalizar correos promocionales que aceptes recibir.",
            "Métricas agregadas para nuestros propios canales.",
          ],
          ifOff: "No recibirás campañas personalizadas. Nunca vendemos tus datos ni hacemos publicidad conductual entre sitios.",
          retention: "Hasta 13 meses.",
          legalBasis: "Tu consentimiento explícito.",
        },
      ]
    : [
        {
          key: "necessary",
          Icon: Lock,
          iconClass: "text-burgundy",
          required: true,
          title: "Strictly necessary",
          oneLiner: "Let you sign in, keep your account secure and make the site work.",
          weUse: [
            "Session token and keeping you signed in.",
            "CSRF protection and basic bot/abuse mitigation.",
            "Remembering your consent choice (this very page).",
            "Securely processing payments (Stripe, when you use it).",
          ],
          ifOff: "The site cannot work without these — that is why they cannot be turned off.",
          retention: "Session or up to 12 months.",
          legalBasis: "Contract performance and legitimate interest (no consent required).",
        },
        {
          key: "functional",
          Icon: Settings2,
          iconClass: "text-primary",
          title: "Functional (preferences)",
          oneLiner: "Remember your choices so you do not have to set them on every visit.",
          weUse: [
            "Language (EN/ES) and time zone.",
            "Light/dark mode and saved search filters.",
            "Whether you already dismissed a banner or notice.",
          ],
          ifOff: "You will have to pick your language, filters and other preferences again on each visit.",
          retention: "Up to 12 months.",
          legalBasis: "Your consent (EU/UK).",
        },
        {
          key: "analytics",
          Icon: BarChart3,
          iconClass: "text-primary",
          title: "Analytics",
          oneLiner: "Help us understand, in aggregate, how the product is used so we can improve it.",
          weUse: [
            "Pages visited and features used (no names, no message content).",
            "Load times and errors so we can spot issues.",
            "Device type, browser and browser language.",
          ],
          ifOff: "The product keeps working the same; we just see fewer signals to improve it.",
          retention: "Up to 14 months, pseudonymous data.",
          legalBasis: "Your consent (EU/UK); legitimate interest in other jurisdictions.",
        },
        {
          key: "marketing",
          Icon: Megaphone,
          iconClass: "text-primary",
          title: "Marketing",
          oneLiner: "Only if you choose to receive personalized promotional communications.",
          weUse: [
            "Measuring whether you arrived from a specific campaign (UTM, referrer).",
            "Personalizing promotional emails you opted into.",
            "Aggregate metrics for our own channels.",
          ],
          ifOff: "You will not receive personalized campaigns. We never sell your data or run cross-site behavioral ads.",
          retention: "Up to 13 months.",
          legalBasis: "Your explicit consent.",
        },
      ];
}

export default function ConsentSettings() {
  const { t, lang } = useI18n();
  const isEs = lang === "es";

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [stored, setStored] = useState<StoredPrefs | null>(null);

  useEffect(() => {
    const s = loadStored();
    if (s) {
      setStored(s);
      setPrefs({ necessary: true, functional: s.functional, analytics: s.analytics, marketing: s.marketing });
    }
  }, []);

  useSeo(
    {
      title: isEs ? "Preferencias de Consentimiento" : "Consent Preferences",
      description: isEs
        ? "Gestiona tus preferencias de cookies y consentimiento en MatchVenezuelan: necesarias, funcionales, analíticas y marketing. Tu elección se guarda en tu navegador."
        : "Manage your cookie and consent preferences on MatchVenezuelan: necessary, functional, analytics and marketing. Your choice is saved in your browser.",
      path: isEs ? "/es/legal/consent" : "/legal/consent",
      lang,
      robots: "noindex,follow",
      alternates: [
        { hreflang: "en", href: "https://matchvenezuelan.com/legal/consent" },
        { hreflang: "es", href: "https://matchvenezuelan.com/es/legal/consent" },
        { hreflang: "x-default", href: "https://matchvenezuelan.com/legal/consent" },
      ],
    },
    [lang],
  );

  const categories = useMemo(() => buildCategories(isEs), [isEs]);

  const persist = (next: Prefs) => {
    const payload: StoredPrefs = {
      v: 1,
      ...next,
      lang: isEs ? "es" : "en",
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    setPrefs(next);
    setStored(payload);
    toast({
      title: isEs ? "Preferencias guardadas" : "Preferences saved",
      description: isEs
        ? "Tu elección se aplicará en este navegador."
        : "Your choice will apply in this browser.",
    });
  };

  const acceptAll = () =>
    persist({ necessary: true, functional: true, analytics: true, marketing: true });
  const rejectOptional = () =>
    persist({ necessary: true, functional: false, analytics: false, marketing: false });

  const formattedSavedAt = stored
    ? new Intl.DateTimeFormat(isEs ? "es" : "en", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(stored.updatedAt))
    : null;

  return (
    <PublicLayout>
      {/* Hero — consistent with other legal pages */}
      <section className="relative isolate overflow-hidden">
        <ParallaxHeroImage src={heroImg} />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/80 via-burgundy/65 to-background" />
        <div className="relative container py-section px-gutter">
          <div className="mx-auto max-w-3xl text-primary-foreground animate-fade-in">
            <p className="text-xs uppercase tracking-widest text-primary-foreground/80">
              {isEs ? "Tus elecciones · Sin oscuros patrones" : "Your choices · No dark patterns"}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">
              {isEs ? "Preferencias de Consentimiento" : "Consent Preferences"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/90 md:text-lg">
              {isEs
                ? "Elige qué categorías de cookies y datos permites. Lo explicamos en lenguaje claro: qué hacemos con cada categoría, qué pasa si la desactivas y cuánto tiempo retenemos los datos."
                : "Choose which categories of cookies and data you allow. We explain it in plain language: what we do with each category, what happens if you turn it off and how long we keep the data."}
            </p>
          </div>
        </div>
      </section>

      <section className="container py-section px-gutter">
        <div className="mx-auto max-w-3xl">
          {/* Saved status */}
          <div
            role="status"
            aria-live="polite"
            className="mt-6 flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            {stored ? (
              <p className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isEs ? "Tus preferencias están guardadas." : "Your preferences are saved."}{" "}
                  <span className="text-muted-foreground">
                    {isEs ? "Última actualización" : "Last updated"}: {formattedSavedAt} ·{" "}
                    {isEs ? "Idioma elegido" : "Chosen language"}:{" "}
                    <span className="font-medium uppercase">{stored.lang}</span>
                  </span>
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2 text-sm text-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {isEs
                    ? "Aún no has guardado preferencias. Estos son los valores por defecto."
                    : "You have not saved preferences yet. These are the defaults."}
                </span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={acceptAll}>
                {isEs ? "Aceptar todas" : "Accept all"}
              </Button>
              <Button size="sm" variant="outline" onClick={rejectOptional}>
                {isEs ? "Rechazar opcionales" : "Reject optional"}
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-10 space-y-5">
            {categories.map((cat) => {
              const enabled = Boolean(prefs[cat.key]);
              return (
                <article
                  key={cat.key}
                  className="rounded-2xl border border-border bg-card p-5 md:p-6"
                >
                  <header className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ${cat.iconClass}`}
                        aria-hidden="true"
                      >
                        <cat.Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-burgundy md:text-xl">
                          {cat.title}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">{cat.oneLiner}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Switch
                        checked={enabled}
                        disabled={cat.required}
                        onCheckedChange={(v) =>
                          persist({ ...prefs, [cat.key]: cat.required ? true : v })
                        }
                        aria-label={cat.title}
                      />
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {cat.required
                          ? isEs ? "Siempre activas" : "Always on"
                          : enabled
                            ? isEs ? "Activas" : "On"
                            : isEs ? "Inactivas" : "Off"}
                      </span>
                    </div>
                  </header>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isEs ? "Para qué las usamos" : "What we use them for"}
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-foreground/85">
                        {cat.weUse.map((line, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {isEs ? "Si las desactivas" : "If you turn them off"}
                        </p>
                        <p className="mt-1 text-foreground/85">{cat.ifOff}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                        <span>
                          <span className="font-semibold text-foreground/80">
                            {isEs ? "Retención" : "Retention"}:
                          </span>{" "}
                          {cat.retention}
                        </span>
                        <span>
                          <span className="font-semibold text-foreground/80">
                            {isEs ? "Base legal" : "Legal basis"}:
                          </span>{" "}
                          {cat.legalBasis}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Footer help */}
          <aside
            role="note"
            className="mt-10 flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-semibold tracking-tight">
                {isEs ? "Tu elección es portátil" : "Your choice is portable"}
              </p>
              <p className="mt-1 text-foreground/80">
                {isEs
                  ? "Guardamos tu decisión en este navegador, junto con el idioma en el que la hiciste, para reflejarla la próxima vez. Puedes cambiarla cuando quieras desde esta página o desde el pie."
                  : "We store your decision in this browser, together with the language you used when making it, so we can reflect it next time. You can change it whenever you want from this page or from the footer."}
              </p>
            </div>
          </aside>

          <p className="mt-8 text-sm text-muted-foreground">
            {isEs ? "Más detalles técnicos en la " : "More technical detail in the "}
            <Link to={isEs ? "/es/legal/cookies" : "/legal/cookies"} className="text-primary hover:underline">
              {t.legal.cookies}
            </Link>
            .
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
