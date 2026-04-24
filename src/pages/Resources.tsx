import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Search, Star, X } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/i18n/datetime";
import type { Lang } from "@/i18n/translations";

type Post = {
  slug: string;
  category: "trust" | "culture" | "relationships" | "safety";
  publishedAt: string; // ISO
  readMin: number;
  featured?: boolean;
  i18n: Record<Lang, { title: string; excerpt: string; keywords: string[] }>;
};

// Editorial content lives here (no CMS yet) — bilingual & versioned in code.
const POSTS: Post[] = [
  {
    slug: "venezuelan-dating-trust-guide",
    category: "trust",
    publishedAt: "2026-04-10",
    readMin: 7,
    featured: true,
    i18n: {
      en: {
        title: "The trust-first guide to dating Venezuelan women online",
        excerpt:
          "Verified profiles, concierge reviews, and the small signals that separate serious connections from noise.",
        keywords: ["verified dating", "Venezuelan women", "trust badges", "online safety"],
      },
      es: {
        title: "Guía de citas con confianza primero para conocer mujeres venezolanas en línea",
        excerpt:
          "Perfiles verificados, revisiones concierge y las pequeñas señales que distinguen conexiones serias del ruido.",
        keywords: ["citas verificadas", "mujeres venezolanas", "insignias de confianza", "seguridad"],
      },
    },
  },
  {
    slug: "bilingual-conversations-101",
    category: "culture",
    publishedAt: "2026-03-22",
    readMin: 5,
    featured: true,
    i18n: {
      en: {
        title: "Bilingual conversations 101: bridging English and Spanish with care",
        excerpt:
          "Practical phrases, translation etiquette, and how to keep nuance alive across two languages.",
        keywords: ["bilingual dating", "Spanish English", "cross-cultural"],
      },
      es: {
        title: "Conversaciones bilingües 101: tender puentes entre inglés y español con cuidado",
        excerpt:
          "Frases prácticas, etiqueta de traducción y cómo mantener viva la sutileza entre dos idiomas.",
        keywords: ["citas bilingües", "inglés español", "interculturalidad"],
      },
    },
  },
  {
    slug: "first-trip-to-meet",
    category: "relationships",
    publishedAt: "2026-02-28",
    readMin: 9,
    featured: true,
    i18n: {
      en: {
        title: "Planning your first trip to meet: a respectful, realistic playbook",
        excerpt:
          "When to travel, what to ask before booking, and how to make the first in-person meeting safe and unhurried.",
        keywords: ["first meeting", "travel to meet", "long distance"],
      },
      es: {
        title: "Planificar tu primer viaje para conocerse: una guía respetuosa y realista",
        excerpt:
          "Cuándo viajar, qué preguntar antes de reservar y cómo hacer el primer encuentro seguro y sin prisas.",
        keywords: ["primer encuentro", "viajar para conocerse", "larga distancia"],
      },
    },
  },
  {
    slug: "spotting-romance-scams",
    category: "safety",
    publishedAt: "2026-02-05",
    readMin: 6,
    i18n: {
      en: {
        title: "Spotting romance scams early — patterns, red flags and what to do",
        excerpt:
          "The most common manipulative patterns, how moderators detect them, and what to report.",
        keywords: ["romance scam", "online safety", "red flags"],
      },
      es: {
        title: "Detectar estafas románticas a tiempo — patrones, señales y qué hacer",
        excerpt:
          "Los patrones manipulativos más comunes, cómo los detectan los moderadores y qué reportar.",
        keywords: ["estafa romántica", "seguridad en línea", "señales de alerta"],
      },
    },
  },
  {
    slug: "what-serious-intent-actually-looks-like",
    category: "relationships",
    publishedAt: "2026-01-18",
    readMin: 4,
    i18n: {
      en: {
        title: "What serious intent actually looks like in modern dating",
        excerpt:
          "Beyond labels: behaviors, follow-through, and the cadence of building something that lasts.",
        keywords: ["serious relationships", "intentions", "dating maturity"],
      },
      es: {
        title: "Cómo se ve realmente la intención seria en las citas modernas",
        excerpt:
          "Más allá de las etiquetas: comportamientos, seguimiento y el ritmo para construir algo que dure.",
        keywords: ["relaciones serias", "intenciones", "madurez en citas"],
      },
    },
  },
  {
    slug: "venezuelan-culture-respect-guide",
    category: "culture",
    publishedAt: "2025-12-12",
    readMin: 8,
    i18n: {
      en: {
        title: "A respectful introduction to Venezuelan culture for partners abroad",
        excerpt:
          "Family, food, faith, music — what to know, ask, and never assume when dating across cultures.",
        keywords: ["Venezuelan culture", "intercultural dating", "respect"],
      },
      es: {
        title: "Una introducción respetuosa a la cultura venezolana para parejas en el extranjero",
        excerpt:
          "Familia, comida, fe, música — qué saber, qué preguntar y qué nunca asumir al salir entre culturas.",
        keywords: ["cultura venezolana", "citas interculturales", "respeto"],
      },
    },
  },
];

const COPY: Record<Lang, {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  sub: string;
  searchPlaceholder: string;
  allCategories: string;
  featuredTitle: string;
  featuredSub: string;
  feedTitle: string;
  feedSub: string;
  noResults: string;
  clear: string;
  readMin: (n: number) => string;
  read: string;
  categories: Record<Post["category"], string>;
}> = {
  en: {
    metaTitle: "Resources & blog · MatchVenezuelan",
    metaDescription:
      "Bilingual guides on safe, serious online dating between Venezuelan women and partners worldwide — verification, culture, and long-distance know-how.",
    eyebrow: "Resources",
    title: "Guides for serious, safe, bilingual dating.",
    sub: "Editorial pieces written with our trust & safety and bilingual community teams.",
    searchPlaceholder: "Search articles…",
    allCategories: "All",
    featuredTitle: "Featured reads",
    featuredSub: "Hand-picked starting points.",
    feedTitle: "All articles",
    feedSub: "Newest first.",
    noResults: "No articles match your search.",
    clear: "Clear",
    readMin: (n) => `${n} min read`,
    read: "Read",
    categories: {
      trust: "Trust & verification",
      culture: "Culture & language",
      relationships: "Relationships",
      safety: "Safety",
    },
  },
  es: {
    metaTitle: "Recursos y blog · MatchVenezuelan",
    metaDescription:
      "Guías bilingües sobre citas serias y seguras entre mujeres venezolanas y parejas en el mundo — verificación, cultura y larga distancia.",
    eyebrow: "Recursos",
    title: "Guías para citas serias, seguras y bilingües.",
    sub: "Artículos escritos con nuestros equipos de confianza, seguridad y comunidad bilingüe.",
    searchPlaceholder: "Buscar artículos…",
    allCategories: "Todas",
    featuredTitle: "Lecturas destacadas",
    featuredSub: "Puntos de partida seleccionados.",
    feedTitle: "Todos los artículos",
    feedSub: "Más recientes primero.",
    noResults: "Ningún artículo coincide con tu búsqueda.",
    clear: "Limpiar",
    readMin: (n) => `${n} min de lectura`,
    read: "Leer",
    categories: {
      trust: "Confianza y verificación",
      culture: "Cultura e idioma",
      relationships: "Relaciones",
      safety: "Seguridad",
    },
  },
};

const CANONICAL_PATH = "/resources";

export default function Resources() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Post["category"]>("all");

  const sorted = useMemo(
    () =>
      [...POSTS].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [],
  );

  const featured = useMemo(() => sorted.filter(p => p.featured).slice(0, 3), [sorted]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter(p => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      const i = p.i18n[lang];
      return (
        i.title.toLowerCase().includes(q) ||
        i.excerpt.toLowerCase().includes(q) ||
        i.keywords.some(k => k.toLowerCase().includes(q))
      );
    });
  }, [sorted, category, search, lang]);

  // Document-head SEO (title, description, canonical, hreflang, og, JSON-LD)
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}${CANONICAL_PATH}`;

    document.title = copy.metaTitle;
    document.documentElement.lang = lang;

    upsertMeta("name", "description", copy.metaDescription);
    upsertMeta("property", "og:title", copy.metaTitle);
    upsertMeta("property", "og:description", copy.metaDescription);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", copy.metaTitle);
    upsertMeta("name", "twitter:description", copy.metaDescription);

    upsertLink("canonical", url);
    upsertHreflang("en", `${origin}${CANONICAL_PATH}`);
    upsertHreflang("es", `${origin}${CANONICAL_PATH}`);
    upsertHreflang("x-default", `${origin}${CANONICAL_PATH}`);

    // JSON-LD: Blog with itemList of posts (server-friendly even if SPA)
    const ld = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: copy.metaTitle,
      description: copy.metaDescription,
      url,
      inLanguage: lang === "en" ? "en-US" : "es-ES",
      blogPost: sorted.map(p => {
        const i = p.i18n[lang];
        return {
          "@type": "BlogPosting",
          headline: i.title,
          description: i.excerpt,
          datePublished: p.publishedAt,
          inLanguage: lang === "en" ? "en-US" : "es-ES",
          keywords: i.keywords.join(", "),
          articleSection: copy.categories[p.category],
          mainEntityOfPage: `${url}#${p.slug}`,
          author: { "@type": "Organization", name: "MatchVenezuelan" },
          publisher: { "@type": "Organization", name: "MatchVenezuelan" },
        };
      }),
    };
    upsertJsonLd("resources-blog-jsonld", ld);
  }, [lang, copy, sorted]);

  const categories: ("all" | Post["category"])[] = ["all", "trust", "culture", "relationships", "safety"];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary-soft/30 to-background">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> {copy.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold text-burgundy md:text-5xl text-balance">
              {copy.title}
            </h1>
            <p className="mt-4 text-muted-foreground">{copy.sub}</p>
          </div>
        </div>
      </section>

      {/* Featured posts */}
      <section aria-labelledby="featured-heading" className="container py-14 md:py-20">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="font-display text-2xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> {copy.featuredTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{copy.featuredSub}</p>
          </div>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map(p => (
            <FeaturedCard key={p.slug} post={p} lang={lang} copy={copy} />
          ))}
        </div>
      </section>

      {/* Feed */}
      <section aria-labelledby="feed-heading" className="border-t border-border/60 bg-muted/20">
        <div className="container py-14 md:py-20">
          <header className="mb-8">
            <h2 id="feed-heading" className="font-display text-2xl font-semibold">
              {copy.feedTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{copy.feedSub}</p>
          </header>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative md:max-w-sm md:flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="pl-8 pr-8 h-10 bg-background"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={copy.clear}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={
                    "rounded-full border px-3 py-1 text-xs transition-colors " +
                    (category === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {c === "all" ? copy.allCategories : copy.categories[c]}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {copy.noResults}
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {filtered.map(p => (
                <FeedCard key={p.slug} post={p} lang={lang} copy={copy} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

function FeaturedCard({
  post,
  lang,
  copy,
}: {
  post: Post;
  lang: Lang;
  copy: (typeof COPY)[Lang];
}) {
  const i = post.i18n[lang];
  return (
    <article
      id={post.slug}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elegant"
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="secondary" className="text-[11px]">
          {copy.categories[post.category]}
        </Badge>
        <span className="text-xs text-muted-foreground">{copy.readMin(post.readMin)}</span>
      </div>
      <h3 className="font-display text-lg font-semibold leading-snug text-balance">
        {i.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {i.excerpt}
      </p>
      <footer className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, lang)}</time>
        <Button asChild size="sm" variant="ghost" className="h-8">
          <Link to={`${CANONICAL_PATH}#${post.slug}`}>
            {copy.read} <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </footer>
    </article>
  );
}

function FeedCard({
  post,
  lang,
  copy,
}: {
  post: Post;
  lang: Lang;
  copy: (typeof COPY)[Lang];
}) {
  const i = post.i18n[lang];
  return (
    <li>
      <article
        id={post.slug}
        className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card/60"
      >
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="text-[11px]">
            {copy.categories[post.category]}
          </Badge>
          <time dateTime={post.publishedAt} className="text-xs text-muted-foreground">
            {formatDate(post.publishedAt, lang)}
          </time>
          <span className="text-xs text-muted-foreground">· {copy.readMin(post.readMin)}</span>
        </div>
        <h3 className="font-display font-semibold leading-snug">{i.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {i.excerpt}
        </p>
      </article>
    </li>
  );
}

/* ---------- Document head helpers ---------- */

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]:not([hreflang])`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertHreflang(hreflang: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`,
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: unknown) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
