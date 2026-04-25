import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Prefs = { necessary: true; functional: boolean; analytics: boolean; marketing: boolean };

const STORAGE_KEY = "mv:consent-prefs";
const DEFAULT_PREFS: Prefs = { necessary: true, functional: true, analytics: false, marketing: false };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...DEFAULT_PREFS, ...parsed, necessary: true };
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function ConsentSettings() {
  const { t, lang } = useI18n();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => setPrefs(loadPrefs()), []);

  useSeo(
    {
      title: t.legal.consent,
      description:
        lang === "es"
          ? "Gestiona tus preferencias de cookies y consentimiento en MatchVenezuelan."
          : "Manage your cookie and consent preferences on MatchVenezuelan.",
      path: "/legal/consent",
      lang,
      robots: "noindex,follow",
    },
    [lang],
  );

  const save = (next: Prefs) => {
    setPrefs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    toast({
      title: lang === "es" ? "Preferencias guardadas" : "Preferences saved",
    });
  };

  const rows: { key: keyof Prefs; title: string; desc: string; locked?: boolean }[] =
    lang === "es"
      ? [
          { key: "necessary", title: "Estrictamente necesarias", desc: "Requeridas para autenticación y seguridad. No se pueden desactivar.", locked: true },
          { key: "functional", title: "Funcionales", desc: "Recuerdan idioma y otras preferencias." },
          { key: "analytics", title: "Analíticas", desc: "Nos ayudan a mejorar el producto de forma agregada." },
          { key: "marketing", title: "Marketing", desc: "Comunicaciones promocionales personalizadas." },
        ]
      : [
          { key: "necessary", title: "Strictly necessary", desc: "Required for authentication and security. Cannot be turned off.", locked: true },
          { key: "functional", title: "Functional", desc: "Remember language and other preferences." },
          { key: "analytics", title: "Analytics", desc: "Help us improve the product in aggregate." },
          { key: "marketing", title: "Marketing", desc: "Personalized promotional communications." },
        ];

  return (
    <PublicLayout>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
            {t.legal.consent}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {lang === "es"
              ? "Elige qué categorías de cookies y datos permites. Puedes cambiar esto en cualquier momento."
              : "Choose which categories of cookies and data you allow. You can change this at any time."}
          </p>

          <div className="mt-10 space-y-4">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-start justify-between gap-6 rounded-2xl border border-border bg-muted/30 p-5"
              >
                <div>
                  <h2 className="font-display text-lg font-semibold">{row.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{row.desc}</p>
                </div>
                <Switch
                  checked={Boolean(prefs[row.key])}
                  disabled={row.locked}
                  onCheckedChange={(v) => save({ ...prefs, [row.key]: row.locked ? true : v })}
                  aria-label={row.title}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => save({ necessary: true, functional: true, analytics: true, marketing: true })}
            >
              {lang === "es" ? "Aceptar todas" : "Accept all"}
            </Button>
            <Button
              variant="outline"
              onClick={() => save({ necessary: true, functional: false, analytics: false, marketing: false })}
            >
              {lang === "es" ? "Rechazar opcionales" : "Reject optional"}
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
