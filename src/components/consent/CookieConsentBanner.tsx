import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, Settings2, BarChart3, Megaphone, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Global cookie / consent banner.
 *
 * Compliance posture (best-effort, plain-language):
 * - GDPR / ePrivacy (EU) + UK PECR/UK-GDPR: opt-in for non-essential, equally
 *   prominent "Reject" action, no pre-ticked boxes, granular categories,
 *   ability to withdraw at any time via /legal/consent.
 * - CCPA / CPRA (California) + other US state laws (VA, CO, CT, UT, etc.):
 *   "Reject optional" acts as a Do-Not-Sell/Share opt-out. We never sell data
 *   or run cross-site behavioral ads.
 * - LGPD (Brazil), POPIA (South Africa), PIPEDA (Canada), APPI (Japan),
 *   PDPA (Singapore/Thailand), Australia Privacy Act, Ley 81 (Panama),
 *   Ley 25.326 (Argentina), LFPDPPP (Mexico): granular consent + clear notice.
 * - Stores the same `mv:consent-prefs` key used by the full Consent
 *   Preferences page so choices stay in sync.
 */

type CategoryKey = "necessary" | "functional" | "analytics" | "marketing";

type Prefs = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type StoredPrefs = Prefs & {
  lang: "en" | "es";
  updatedAt: string;
  v: 1;
};

const STORAGE_KEY = "mv:consent-prefs";

function readStored(): StoredPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<StoredPrefs>;
    return {
      v: 1,
      necessary: true,
      functional: Boolean(p.functional),
      analytics: Boolean(p.analytics),
      marketing: Boolean(p.marketing),
      lang: p.lang === "es" ? "es" : "en",
      updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function writeStored(prefs: Prefs, lang: "en" | "es") {
  const payload: StoredPrefs = {
    v: 1,
    ...prefs,
    lang,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("mv:consent-updated", { detail: payload }));
  } catch {
    /* ignore */
  }
}

export function CookieConsentBanner() {
  const { lang } = useI18n();
  const isEs = lang === "es";

  const [visible, setVisible] = useState(false);
  const [openCustomize, setOpenCustomize] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Defer to next frame so we don't flash on hydration
    const id = window.setTimeout(() => {
      const stored = readStored();
      if (!stored) {
        setVisible(true);
      } else {
        setPrefs({
          necessary: true,
          functional: stored.functional,
          analytics: stored.analytics,
          marketing: stored.marketing,
        });
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, []);

  const acceptAll = () => {
    const next: Prefs = { necessary: true, functional: true, analytics: true, marketing: true };
    setPrefs(next);
    writeStored(next, isEs ? "es" : "en");
    setVisible(false);
    setOpenCustomize(false);
  };

  const rejectOptional = () => {
    const next: Prefs = { necessary: true, functional: false, analytics: false, marketing: false };
    setPrefs(next);
    writeStored(next, isEs ? "es" : "en");
    setVisible(false);
    setOpenCustomize(false);
  };

  const saveSelection = () => {
    writeStored(prefs, isEs ? "es" : "en");
    setVisible(false);
    setOpenCustomize(false);
  };

  if (!visible) return null;

  const labels = isEs
    ? {
        eyebrow: "Tu privacidad",
        title: "Tú decides qué cookies usamos",
        body:
          "Usamos cookies estrictamente necesarias para que el sitio funcione. Con tu permiso, también usamos cookies funcionales, analíticas y de marketing. No vendemos tus datos ni hacemos publicidad conductual entre sitios.",
        accept: "Aceptar todas",
        reject: "Rechazar opcionales",
        customize: "Personalizar",
        learnMore: "Política de cookies",
        close: "Cerrar",
        customizeTitle: "Preferencias de cookies",
        customizeDesc:
          "Activa solo las categorías que aceptas. Las estrictamente necesarias siempre están activas porque sin ellas el sitio no puede funcionar.",
        save: "Guardar selección",
        manageLater: "Puedes cambiar esto en cualquier momento en",
        managePage: "Preferencias de Consentimiento",
        cats: {
          necessary: {
            title: "Estrictamente necesarias",
            desc: "Inicio de sesión, seguridad de la cuenta, recordar tu elección de consentimiento.",
            always: "Siempre activas",
          },
          functional: {
            title: "Funcionales",
            desc: "Idioma (EN/ES), modo claro/oscuro y filtros de búsqueda guardados.",
          },
          analytics: {
            title: "Analíticas",
            desc: "Estadísticas agregadas para mejorar el producto. Sin nombres, sin contenido de mensajes.",
          },
          marketing: {
            title: "Marketing",
            desc: "Medir campañas y personalizar correos promocionales que aceptes recibir.",
          },
        },
      }
    : {
        eyebrow: "Your privacy",
        title: "You choose which cookies we use",
        body:
          "We use strictly necessary cookies so the site can work. With your permission, we also use functional, analytics and marketing cookies. We never sell your data or run cross-site behavioral ads.",
        accept: "Accept all",
        reject: "Reject optional",
        customize: "Customize",
        learnMore: "Cookie Policy",
        close: "Close",
        customizeTitle: "Cookie preferences",
        customizeDesc:
          "Turn on only the categories you accept. Strictly necessary cookies are always on because the site cannot work without them.",
        save: "Save selection",
        manageLater: "You can change this at any time on",
        managePage: "Consent Preferences",
        cats: {
          necessary: {
            title: "Strictly necessary",
            desc: "Sign-in, account security, remembering your consent choice.",
            always: "Always on",
          },
          functional: {
            title: "Functional",
            desc: "Language (EN/ES), light/dark mode and saved search filters.",
          },
          analytics: {
            title: "Analytics",
            desc: "Aggregate stats to improve the product. No names, no message content.",
          },
          marketing: {
            title: "Marketing",
            desc: "Measure campaigns and personalize promotional emails you opted into.",
          },
        },
      };

  const cookiesHref = isEs ? "/es/legal/cookies" : "/legal/cookies";
  const consentHref = isEs ? "/es/legal/consent" : "/legal/consent";

  const categoryRows: Array<{
    key: CategoryKey;
    Icon: typeof Lock;
    title: string;
    desc: string;
    required?: boolean;
  }> = [
    { key: "necessary", Icon: Lock, title: labels.cats.necessary.title, desc: labels.cats.necessary.desc, required: true },
    { key: "functional", Icon: Settings2, title: labels.cats.functional.title, desc: labels.cats.functional.desc },
    { key: "analytics", Icon: BarChart3, title: labels.cats.analytics.title, desc: labels.cats.analytics.desc },
    { key: "marketing", Icon: Megaphone, title: labels.cats.marketing.title, desc: labels.cats.marketing.desc },
  ];

  return (
    <>
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="mv-cookie-title"
        aria-describedby="mv-cookie-desc"
        className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6 animate-fade-in"
      >
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Cookie className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {labels.eyebrow}
              </p>
              <h2
                id="mv-cookie-title"
                className="mt-1 font-display text-lg font-semibold text-burgundy md:text-xl"
              >
                {labels.title}
              </h2>
              <p id="mv-cookie-desc" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {labels.body}{" "}
                <Link
                  to={cookiesHref}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {labels.learnMore}
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col md:items-stretch md:gap-2 lg:flex-row">
              <Button onClick={acceptAll} className="min-w-[140px]">
                {labels.accept}
              </Button>
              <Button onClick={rejectOptional} variant="outline" className="min-w-[140px]">
                {labels.reject}
              </Button>
              <Button
                onClick={() => setOpenCustomize(true)}
                variant="ghost"
                className="min-w-[140px]"
              >
                {labels.customize}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={openCustomize} onOpenChange={setOpenCustomize}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto sm:max-w-2xl sm:mx-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-xl text-burgundy">
              {labels.customizeTitle}
            </SheetTitle>
            <SheetDescription>{labels.customizeDesc}</SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-3">
            {categoryRows.map((row) => {
              const enabled = Boolean(prefs[row.key]);
              return (
                <div
                  key={row.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      aria-hidden="true"
                    >
                      <row.Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{row.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {row.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Switch
                      checked={enabled}
                      disabled={row.required}
                      onCheckedChange={(v) =>
                        setPrefs((p) => ({ ...p, [row.key]: row.required ? true : v }))
                      }
                      aria-label={row.title}
                    />
                    {row.required ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {labels.cats.necessary.always}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            {labels.manageLater}{" "}
            <Link
              to={consentHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => setOpenCustomize(false)}
            >
              {labels.managePage}
            </Link>
            .
          </p>

          <SheetFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={rejectOptional}>
              {labels.reject}
            </Button>
            <Button variant="ghost" onClick={acceptAll}>
              {labels.accept}
            </Button>
            <Button onClick={saveSelection}>{labels.save}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default CookieConsentBanner;
