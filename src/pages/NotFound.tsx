import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, CornerDownLeft, Home, HelpCircle, Mail, Search, ShieldCheck, X } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/I18nProvider";
import { useSeo } from "@/seo/seo";
import { cn } from "@/lib/utils";
import notFoundIllustration from "@/assets/not-found-letter.jpg";

type SearchEntry = {
  to: string;
  label: string;
  desc: string;
  keywords: string;
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useI18n();

  // Derive language from the URL itself so the page renders correctly on
  // first paint even before the I18nProvider's effect runs (important for
  // direct hits to /es/<broken-url>).
  const isEs = location.pathname === "/es" || location.pathname.startsWith("/es/");
  const homeHref = isEs ? "/es/" : "/";

  // Keep the global provider in sync so header/footer/SEO match the URL.
  useEffect(() => {
    const target = isEs ? "es" : "en";
    if (lang !== target) setLang(target);
  }, [isEs, lang, setLang]);

  useEffect(() => {
    // Useful for analytics on broken inbound links.
    console.warn("404 — route not found:", location.pathname);
  }, [location.pathname]);

  const goBack = useCallback(() => {
    // history.length > 1 means there is at least one prior entry in this tab.
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homeHref, { replace: true });
    }
  }, [navigate, homeHref]);

  // --- Lightweight site search -------------------------------------------------
  // Curated, language-aware index of public pages findable from the 404.
  // Only include routes that ACTUALLY exist for the current language.
  const searchIndex = useMemo<SearchEntry[]>(() => {
    return isEs
      ? [
          { to: "/es/", label: "Inicio", desc: "Página principal", keywords: "inicio home principal portada" },
          { to: "/es/safety", label: "Seguridad", desc: "Verificación, moderación y reportes", keywords: "seguridad verificacion moderacion reportar trust safety" },
          { to: "/es/faq", label: "Preguntas frecuentes", desc: "Respuestas a las dudas más comunes", keywords: "faq preguntas frecuentes ayuda dudas" },
          { to: "/es/legal/terms", label: "Términos de servicio", desc: "Condiciones de uso del servicio", keywords: "terminos servicio condiciones legal" },
          { to: "/es/legal/privacy", label: "Política de privacidad", desc: "Cómo tratamos tus datos personales", keywords: "privacidad datos personales rgpd gdpr" },
          { to: "/es/legal/cookies", label: "Política de cookies", desc: "Cookies que usamos y por qué", keywords: "cookies rastreo tracking" },
          { to: "/es/legal/consent", label: "Preferencias de consentimiento", desc: "Cambia tus preferencias de cookies", keywords: "consentimiento preferencias cookies privacidad" },
          { to: "/es/legal/community-guidelines", label: "Normas de la comunidad", desc: "Cómo nos tratamos aquí", keywords: "normas comunidad reglas convivencia" },
          { to: "/es/legal/refunds", label: "Política de reembolsos", desc: "Reembolsos y derecho de desistimiento", keywords: "reembolso devolucion desistimiento facturacion" },
          { to: "/es/legal/disclaimer", label: "Aviso legal", desc: "Descargo de responsabilidad", keywords: "aviso legal descargo responsabilidad" },
        ]
      : [
          { to: "/", label: "Home", desc: "Main landing page", keywords: "home start landing main" },
          { to: "/how-it-works", label: "How it works", desc: "The journey, step by step", keywords: "how it works steps onboarding journey" },
          { to: "/safety", label: "Safety", desc: "Verification, moderation and reporting", keywords: "safety trust verification moderation report" },
          { to: "/faq", label: "FAQ", desc: "Answers to common questions", keywords: "faq questions help support" },
          { to: "/resources", label: "Resources", desc: "Articles, guides and culture notes", keywords: "resources blog articles guides" },
          { to: "/legal/terms", label: "Terms of service", desc: "Service terms and conditions", keywords: "terms conditions legal tos" },
          { to: "/legal/privacy", label: "Privacy policy", desc: "How we handle your data", keywords: "privacy data gdpr ccpa" },
          { to: "/legal/cookies", label: "Cookie policy", desc: "Cookies we use and why", keywords: "cookies tracking" },
          { to: "/legal/consent", label: "Consent preferences", desc: "Change your cookie settings", keywords: "consent preferences cookies privacy" },
          { to: "/legal/community-guidelines", label: "Community guidelines", desc: "How we treat each other here", keywords: "community guidelines rules conduct" },
          { to: "/legal/refunds", label: "Refund policy", desc: "Refunds and right of withdrawal", keywords: "refund return billing withdrawal" },
          { to: "/legal/disclaimer", label: "Legal disclaimer", desc: "Limits of liability and scope", keywords: "disclaimer liability legal" },
          { to: "/legal/acceptable-use", label: "Acceptable use", desc: "What's allowed on the platform", keywords: "acceptable use abuse rules" },
          { to: "/auth", label: "Sign in / Join", desc: "Access your account or create one", keywords: "sign in login signup join register account" },
        ];
  }, [isEs]);

  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchEntry[];
    const tokens = q.split(/\s+/).filter(Boolean);
    return searchIndex
      .filter((e) => {
        const hay = `${e.label} ${e.desc} ${e.keywords} ${e.to}`.toLowerCase();
        return tokens.every((tok) => hay.includes(tok));
      })
      .slice(0, 6);
  }, [query, searchIndex]);

  // Reset highlighted result whenever the result set changes.
  useEffect(() => { setActiveIdx(0); }, [query, isEs]);

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length) setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      const target = results[activeIdx];
      if (target) {
        e.preventDefault();
        navigate(target.to);
      }
    } else if (e.key === "Escape") {
      if (query) {
        e.preventDefault();
        setQuery("");
      }
    }
  };

  useSeo(
    {
      title: isEs ? "Página no encontrada (404)" : "Page not found (404)",
      description: isEs
        ? "Esta página parece haberse perdido en el camino. Vuelve al inicio o explora nuestras secciones principales."
        : "This page seems to have lost its way. Head back home or explore our main sections.",
      path: location.pathname,
      lang: isEs ? "es" : "en",
      robots: "noindex,follow",
    },
    [isEs, location.pathname],
  );

  // Only link to routes that actually exist for the current language so the
  // "helpful" cards never hand the user another 404.
  // ES public routes today: /es/, /es/faq, /es/safety, /es/legal/*.
  const t = isEs
    ? {
        eyebrow: "Error 404",
        title: "Esta carta perdió el camino.",
        sub: "La página que buscas no existe, fue movida o el enlace está incompleto. No te preocupes — todavía hay muchas formas de continuar tu historia con nosotros.",
        path: "Ruta solicitada",
        backHome: "Volver al inicio",
        goBack: "Página anterior",
        exploreTitle: "¿Y ahora?",
        exploreSub: "Algunos lugares populares para retomar tu visita:",
        links: [
          { to: "/es/", label: "Inicio", icon: Home, desc: "Vuelve a la página principal." },
          { to: "/es/safety", label: "Seguridad", icon: ShieldCheck, desc: "Verificación y moderación." },
          { to: "/es/faq", label: "Preguntas frecuentes", icon: HelpCircle, desc: "Respuestas claras y honestas." },
          { to: "/es/legal/community-guidelines", label: "Normas de la comunidad", icon: Compass, desc: "Cómo nos tratamos aquí." },
        ],
        contact: "¿Crees que esto es un error?",
        contactCta: "Escríbenos",
        imgAlt: "Carta de amor sellada con corazón dorado, perdida entre flores tropicales y una rosa de los vientos.",
      }
    : {
        eyebrow: "Error 404",
        title: "This letter lost its way.",
        sub: "The page you're looking for doesn't exist, was moved, or the link is incomplete. Don't worry — there are still plenty of ways to continue your story with us.",
        path: "Requested path",
        backHome: "Back to home",
        goBack: "Previous page",
        exploreTitle: "Where to next?",
        exploreSub: "A few popular places to pick up where you left off:",
        links: [
          { to: "/", label: "Home", icon: Home, desc: "Return to the homepage." },
          { to: "/how-it-works", label: "How it works", icon: Compass, desc: "Get the lay of the land." },
          { to: "/safety", label: "Safety", icon: ShieldCheck, desc: "Verification & moderation." },
          { to: "/faq", label: "FAQ", icon: HelpCircle, desc: "Clear, honest answers." },
        ],
        contact: "Think this is a mistake?",
        contactCta: "Contact us",
        imgAlt: "Love letter sealed with a gold heart, drifting among tropical petals and a compass rose.",
      };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        {/* Soft hero wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-1/2 -z-10 h-[40rem] w-[40rem] translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, hsl(var(--primary-soft)), transparent)" }}
        />

        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24 lg:gap-16">
          {/* Copy */}
          <div className="order-2 max-w-xl md:order-1 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <Compass className="h-3.5 w-3.5 text-[hsl(var(--gold))]" aria-hidden />
              {t.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-burgundy sm:text-5xl md:text-6xl">
              {t.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{t.sub}</p>

            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-dashed border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-burgundy">{t.path}</span>
              <code className="truncate font-mono text-[12px] text-foreground">{location.pathname}</code>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={homeHref}>
                  <Home className="mr-2 h-4 w-4" aria-hidden /> {t.backHome}
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> {t.goBack}
              </Button>
            </div>
          </div>

          {/* Illustration */}
          <div className="order-1 md:order-2">
            <div className="relative mx-auto max-w-md md:max-w-none">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-[2rem] blur-2xl opacity-60"
                style={{ background: "var(--gradient-soft)" }}
              />
              <div className="relative animate-[float_7s_ease-in-out_infinite]">
                <img
                  src={notFoundIllustration}
                  alt={t.imgAlt}
                  width={1280}
                  height={1024}
                  className="w-full rounded-[2rem] border border-border/60 shadow-[var(--shadow-elegant)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Helpful links */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="container py-14">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-display text-2xl font-semibold text-burgundy sm:text-3xl">{t.exploreTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t.exploreSub}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {t.links.map(({ to, label, desc, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-burgundy transition-colors group-hover:bg-[hsl(var(--gold))] group-hover:text-burgundy">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-display text-base font-semibold text-burgundy">{label}</span>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-10 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-[hsl(var(--gold))]" aria-hidden />
            {t.contact}{" "}
            <a className="story-link font-semibold text-burgundy" href="mailto:hello@matchvenezuelan.com">
              {t.contactCta}
            </a>
          </p>
        </div>
      </section>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
      `}</style>
    </PublicLayout>
  );
};

export default NotFound;
