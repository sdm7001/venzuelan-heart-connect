// Public, unauthenticated XML sitemap + RSS feed for MatchVenezuelan.
// - GET /functions/v1/seo-feed?type=sitemap → application/xml
// - GET /functions/v1/seo-feed?type=rss     → application/rss+xml
//
// Pulls live data from blog_posts (published=true) so updates appear
// automatically. Cached at the edge for 5 minutes.

const SITE_URL = "https://www.matchvenezuelan.com";
const SITE_NAME = "MatchVenezuelan";

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/safety", changefreq: "monthly", priority: "0.8" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/resources", changefreq: "daily", priority: "0.9" },
  { path: "/legal/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/legal/acceptable-use", changefreq: "yearly", priority: "0.3" },
  { path: "/legal/anti-solicitation", changefreq: "yearly", priority: "0.3" },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Post = {
  slug: string;
  category: string;
  published_at: string;
  updated_at: string;
  title_en: string;
  title_es: string;
  excerpt_en: string;
  excerpt_es: string;
  meta_description_en: string;
  meta_description_es: string;
  hero_image_url: string | null;
  tags: string[];
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function abs(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchPosts(): Promise<Post[]> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return [];
  const params = new URLSearchParams({
    select:
      "slug,category,published_at,updated_at,title_en,title_es,excerpt_en,excerpt_es,meta_description_en,meta_description_es,hero_image_url,tags",
    published: "eq.true",
    order: "published_at.desc",
    limit: "500",
  });
  const res = await fetch(`${url}/rest/v1/blog_posts?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  return (await res.json()) as Post[];
}

function buildSitemap(posts: Post[], lang: "en" | "es" | "all" = "all"): string {
  const now = new Date().toISOString();
  const urls: string[] = [];

  const altLinks = (loc: string) =>
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(loc)}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(loc)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(loc)}"/>`;

  // Static routes
  for (const r of STATIC_ROUTES) {
    const loc = abs(r.path);
    urls.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
${altLinks(loc)}
  </url>`);
  }

  // Blog post routes — filter by language presence when lang-scoped
  for (const p of posts) {
    if (lang === "en" && !p.title_en) continue;
    if (lang === "es" && !p.title_es) continue;

    const loc = abs(`/resources/${p.slug}`);
    const lastmod = (p.updated_at ?? p.published_at) || now;
    const image = p.hero_image_url ? abs(p.hero_image_url) : null;
    const imageBlock = image
      ? `\n    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`
      : "";
    urls.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
${altLinks(loc)}${imageBlock}
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;
}

function buildSitemapIndex(): string {
  const now = new Date().toISOString();
  const children = [
    `${SITE_URL}/sitemap-en.xml`,
    `${SITE_URL}/sitemap-es.xml`,
  ];
  const entries = children
    .map(
      (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
}

function buildRss(posts: Post[], lang: "en" | "es"): string {
  const feedTitle =
    lang === "es"
      ? `${SITE_NAME} — Recursos`
      : `${SITE_NAME} — Resources`;
  const feedDesc =
    lang === "es"
      ? "Guías bilingües sobre citas serias y seguras entre mujeres venezolanas y parejas en todo el mundo."
      : "Bilingual guides on safe, serious online dating between Venezuelan women and partners worldwide.";

  const items = posts.slice(0, 50).map((p) => {
    const url = abs(`/resources/${p.slug}`);
    const title = lang === "es" ? p.title_es : p.title_en;
    const desc =
      (lang === "es" ? p.meta_description_es : p.meta_description_en) ||
      (lang === "es" ? p.excerpt_es : p.excerpt_en);
    const pubDate = new Date(p.published_at).toUTCString();
    const categories = (p.tags ?? [])
      .map((t) => `      <category>${escapeXml(t)}</category>`)
      .join("\n");
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(desc)}</description>
${categories}
    </item>`;
  });

  const selfHref = `${SITE_URL}/rss${lang === "es" ? "-es" : ""}.xml`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${SITE_URL}/resources</link>
    <atom:link href="${selfHref}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(feedDesc)}</description>
    <language>${lang === "es" ? "es-ES" : "en-US"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "sitemap").toLowerCase();
  const lang = (url.searchParams.get("lang") ?? "en").toLowerCase() === "es"
    ? "es"
    : "en";

  try {
    const posts = await fetchPosts();
    let body: string;
    let contentType: string;

    if (type === "rss") {
      body = buildRss(posts, lang);
      contentType = "application/rss+xml; charset=utf-8";
    } else {
      body = buildSitemap(posts);
      contentType = "application/xml; charset=utf-8";
    }

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(String(err))}</error>`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      },
    );
  }
});
