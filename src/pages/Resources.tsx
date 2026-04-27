import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Search, Star, X } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/i18n/datetime";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/i18n/translations";
import { useSeo, blogPostingLd, breadcrumbLd } from "@/seo/seo";
import heroImg from "@/assets/hero-resources.jpg";
import { ParallaxHeroImage } from "@/components/layout/ParallaxHeroImage";

type Post = {
  slug: string;
  category: "trust" | "culture" | "relationships" | "safety";
  publishedAt: string; // ISO
  readMin: number;
  featured?: boolean;
  i18n: Record<Lang, { title: string; excerpt: string; keywords: string[] }>;
};

// Posts come from the blog_posts table (RLS: published rows are public).
const POSTS: Post[] = [];


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
  prev: string;
  next: string;
  pageOf: (page: number, total: number) => string;
  showing: (from: number, to: number, total: number) => string;
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
    prev: "Previous",
    next: "Next",
    pageOf: (p, t) => `Page ${p} of ${t}`,
    showing: (f, to, t) => `Showing ${f}–${to} of ${t}`,
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
    prev: "Anterior",
    next: "Siguiente",
    pageOf: (p, t) => `Página ${p} de ${t}`,
    showing: (f, to, t) => `Mostrando ${f}–${to} de ${t}`,
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<"all" | Post["category"]>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  // Reset to page 1 when filters/search/lang change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, lang]);

  // Debounce search input → 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch posts from DB with server-side filtering by language, category, and search.
  useEffect(() => {
    let cancel = false;
    setLoading(true);

    let q = supabase
      .from("blog_posts")
      .select(
        "slug,category,reading_minutes,featured,published_at,title_en,excerpt_en,tags,title_es,excerpt_es",
      )
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (category !== "all") q = q.eq("category", category);

    if (debouncedSearch) {
      // Escape % , and ) which are special in PostgREST or() values.
      const safe = debouncedSearch
        .replace(/,/g, " ")
        .replace(/\(/g, " ")
        .replace(/\)/g, " ")
        .replace(/%/g, " ")
        .trim();
      const pat = `%${safe}%`;
      // Search across the active language's title/excerpt + shared tags.
      const fields =
        lang === "en"
          ? [`title_en.ilike.${pat}`, `excerpt_en.ilike.${pat}`, `body_en.ilike.${pat}`]
          : [`title_es.ilike.${pat}`, `excerpt_es.ilike.${pat}`, `body_es.ilike.${pat}`];
      q = q.or([...fields, `tags.cs.{${safe}}`].join(","));
    }

    q.then(({ data }) => {
      if (cancel) return;
      const rows = data ?? [];
      setPosts(
        rows.map((r: Record<string, unknown>) => ({
          slug: r.slug,
          category: r.category,
          publishedAt: r.published_at,
          readMin: r.reading_minutes,
          featured: r.featured,
          i18n: {
            en: { title: r.title_en, excerpt: r.excerpt_en, keywords: r.tags ?? [] },
            es: { title: r.title_es, excerpt: r.excerpt_es, keywords: r.tags ?? [] },
          },
        })),
      );
      setLoading(false);
    });

    return () => { cancel = true; };
  }, [category, debouncedSearch, lang]);

  const sorted = posts;

  const featured = useMemo(
    () => (debouncedSearch || category !== "all" ? [] : sorted.filter(p => p.featured).slice(0, 3)),
    [sorted, debouncedSearch, category],
  );

  // Pagination operates on the full sorted feed
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const toIdx = Math.min(fromIdx + PAGE_SIZE, total);
  const filtered = sorted.slice(fromIdx, toIdx);

  // Centralized SEO: title, description, canonical, hreflang, OG, Twitter, JSON-LD
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${copy.metaTitle}`,
    description: copy.metaDescription,
    inLanguage: lang === "en" ? "en-US" : "es-ES",
    blogPost: sorted.map((p) => {
      const i = p.i18n[lang];
      return blogPostingLd({
        title: i.title,
        description: i.excerpt,
        url: `${typeof window !== "undefined" ? window.location.origin : ""}/resources/${p.slug}`,
        lang,
        publishedAt: p.publishedAt,
        section: copy.categories[p.category],
        tags: i.keywords,
      });
    }),
  };

  useSeo(
    {
      title: copy.metaTitle,
      titleAbsolute: true,
      description: copy.metaDescription,
      path: CANONICAL_PATH,
      lang,
      type: "website",
      feeds: [
        { title: "MatchVenezuelan — Resources (EN)", href: "/rss.xml" },
        { title: "MatchVenezuelan — Recursos (ES)", href: "/rss-es.xml" },
      ],
      jsonLd: [
        blogLd,
        breadcrumbLd([
          { name: lang === "en" ? "Home" : "Inicio", url: "/" },
          { name: copy.eyebrow, url: CANONICAL_PATH },
        ]),
      ],
    },
    [lang, sorted.length],
  );

  const categories: ("all" | Post["category"])[] = ["all", "trust", "culture", "relationships", "safety"];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <ParallaxHeroImage src={heroImg} />
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy/75 via-burgundy/55 to-background" />
        <div className="relative container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center text-primary-foreground animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <BookOpen className="h-3.5 w-3.5" /> {copy.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl text-balance drop-shadow-sm">
              {copy.title}
            </h1>
            <p className="mt-4 text-primary-foreground/90 md:text-lg">{copy.sub}</p>
          </div>
        </div>
      </section>

      {/* Featured posts — hidden when filtering or searching */}
      {featured.length > 0 && (
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
      )}

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

          {total === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {copy.noResults}
            </div>
          ) : (
            <>
              <ul className="grid gap-4 md:grid-cols-2">
                {filtered.map(p => (
                  <FeedCard key={p.slug} post={p} lang={lang} copy={copy} />
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label={lang === "en" ? "Pagination" : "Paginación"}
                  className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
                >
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {copy.showing(fromIdx + 1, toIdx, total)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                      {copy.prev}
                    </Button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const n = i + 1;
                      const active = n === safePage;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          aria-current={active ? "page" : undefined}
                          aria-label={lang === "en" ? `Go to page ${n}` : `Ir a la página ${n}`}
                          className={
                            "h-8 min-w-8 rounded-md border px-2 text-xs transition-colors " +
                            (active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground")
                          }
                        >
                          {n}
                        </button>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {copy.next}
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </nav>
              )}
            </>
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
          <Link to={`${CANONICAL_PATH}/${post.slug}`}>
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
      <Link
        to={`${CANONICAL_PATH}/${post.slug}`}
        className="block h-full"
      >
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
      </Link>
    </li>
  );
}

/* SEO helpers moved to @/seo/seo */
