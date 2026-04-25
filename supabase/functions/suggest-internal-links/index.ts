// Suggest internal links for a blog post, in EN + ES.
// Combines deterministic similarity (tags + category + lexical overlap)
// against existing published posts AND the canonical site map, then asks
// Lovable AI to pick the best 4–6 and write contextual anchor text per language.
//
// POST body:
//   {
//     slug?: string,            // existing post slug to exclude / use as basis
//     category?: string,
//     tags?: string[],
//     title_en?: string, body_en?: string,
//     title_es?: string, body_es?: string,
//     limit?: number            // 1..10, default 6
//   }
//
// Response:
//   {
//     suggestions_en: { label: string; href: string; reason: string }[],
//     suggestions_es: { label: string; href: string; reason: string }[],
//     candidates: { href: string; kind: "post" | "page"; score: number; meta?: any }[]
//   }
//
// Public (verify_jwt=false) — read-only against published posts.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_PAGES: { href: string; en: { label: string; topic: string }; es: { label: string; topic: string } }[] = [
  {
    href: "/how-it-works",
    en: { label: "How MatchVenezuelan works", topic: "intro to product, matching, contact rules" },
    es: { label: "Cómo funciona MatchVenezuelan", topic: "intro al producto, emparejamiento, reglas de contacto" },
  },
  {
    href: "/safety",
    en: { label: "Safety & trust at MatchVenezuelan", topic: "safety, scams, reporting, blocking" },
    es: { label: "Seguridad y confianza en MatchVenezuelan", topic: "seguridad, estafas, reportes, bloqueo" },
  },
  {
    href: "/faq",
    en: { label: "Frequently asked questions", topic: "common questions, billing, verification basics" },
    es: { label: "Preguntas frecuentes", topic: "preguntas comunes, facturación, verificación" },
  },
  {
    href: "/legal/tos",
    en: { label: "Terms of Service", topic: "terms, eligibility, conduct rules" },
    es: { label: "Términos del Servicio", topic: "términos, elegibilidad, normas de conducta" },
  },
  {
    href: "/legal/privacy",
    en: { label: "Privacy Policy", topic: "privacy, data retention, GDPR" },
    es: { label: "Política de Privacidad", topic: "privacidad, retención de datos, GDPR" },
  },
  {
    href: "/legal/aup",
    en: { label: "Acceptable Use Policy", topic: "acceptable use, prohibited behavior" },
    es: { label: "Política de Uso Aceptable", topic: "uso aceptable, conductas prohibidas" },
  },
  {
    href: "/legal/asp",
    en: { label: "Anti-Scam Policy", topic: "anti-scam, romance fraud, money requests" },
    es: { label: "Política Antiestafa", topic: "antiestafa, fraude romántico, solicitudes de dinero" },
  },
  {
    href: "/resources",
    en: { label: "All resources", topic: "blog index, all articles" },
    es: { label: "Todos los recursos", topic: "índice del blog, todos los artículos" },
  },
];

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

const STOP = new Set([
  "this","that","with","from","your","about","have","they","there","their","what","when","where","which","while","over","under","into","also","more","than","such","like","just","very","most","some","other","each","then","because","being","been","were","will","would","could","should","para","como","pero","esta","este","esto","todo","todos","entre","sobre","desde","cuando","donde","tener","tiene","tienen","puede","pueden","muy","mas","menos","porque",
]);

function freq(words: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of words) if (!STOP.has(w)) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

function cosineLike(a: Map<string, number>, b: Map<string, number>): number {
  if (!a.size || !b.size) return 0;
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of a) { na += v * v; if (b.has(k)) dot += v * (b.get(k) as number); }
  for (const v of b.values()) nb += v * v;
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

    try {
      const body = await req.json().catch(() => ({}));
      const {
        slug,
        category,
        tags = [],
        title_en = "",
        body_en = "",
        title_es = "",
        body_es = "",
        limit = 6,
      } = body ?? {};

      const max = Math.max(1, Math.min(10, Number(limit) || 6));

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Pull published posts (RLS allows anon to read published rows).
      const { data: rows, error } = await sb
        .from("blog_posts")
        .select(
          "slug,category,tags,title_en,excerpt_en,title_es,excerpt_es",
        )
        .eq("published", true);
      if (error) throw error;

      // Build "self" doc vector from EN + ES + tags + category.
      const selfTokens = [
        ...tokenize(title_en), ...tokenize(body_en),
        ...tokenize(title_es), ...tokenize(body_es),
        ...tags.flatMap((t: string) => tokenize(t)),
        ...(category ? tokenize(category) : []),
      ];
      const selfFreq = freq(selfTokens);

      // Score every other post.
      type Cand = {
        href: string;
        kind: "post" | "page";
        score: number;
        meta: Record<string, unknown>;
      };
      const candidates: Cand[] = [];

      for (const r of rows ?? []) {
        if (slug && r.slug === slug) continue;
        const otherTokens = [
          ...tokenize(r.title_en), ...tokenize(r.excerpt_en ?? ""),
          ...tokenize(r.title_es), ...tokenize(r.excerpt_es ?? ""),
          ...((r.tags ?? []) as string[]).flatMap((t) => tokenize(t)),
          ...tokenize(r.category ?? ""),
        ];
        const otherFreq = freq(otherTokens);

        const lex = cosineLike(selfFreq, otherFreq);

        const sharedTags = ((r.tags ?? []) as string[]).filter((t) =>
          (tags as string[]).map((x) => x.toLowerCase()).includes(t.toLowerCase())
        ).length;
        const tagBoost = Math.min(0.4, sharedTags * 0.12);

        const sameCategory = category && r.category === category ? 0.15 : 0;

        const score = +(lex + tagBoost + sameCategory).toFixed(4);

        candidates.push({
          href: `/resources/${r.slug}`,
          kind: "post",
          score,
          meta: {
            category: r.category,
            tags: r.tags ?? [],
            title_en: r.title_en,
            title_es: r.title_es,
            excerpt_en: r.excerpt_en,
            excerpt_es: r.excerpt_es,
          },
        });
      }

      // Score canonical site pages too.
      for (const p of SITE_PAGES) {
        const pTokens = [
          ...tokenize(p.en.label), ...tokenize(p.en.topic),
          ...tokenize(p.es.label), ...tokenize(p.es.topic),
        ];
        const pFreq = freq(pTokens);
        const lex = cosineLike(selfFreq, pFreq);
        candidates.push({
          href: p.href,
          kind: "page",
          score: +lex.toFixed(4),
          meta: { en: p.en, es: p.es },
        });
      }

      candidates.sort((a, b) => b.score - a.score);
      const shortlist = candidates.slice(0, Math.max(8, max + 4));

      // Ask Lovable AI to pick the best `max` and write bilingual anchor text.
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      let suggestions_en: { label: string; href: string }[] = [];
      let suggestions_es: { label: string; href: string }[] = [];

      if (LOVABLE_API_KEY && shortlist.length > 0) {
        const sysPrompt =
          "You select internal links for a bilingual (English + Spanish) blog about Venezuelan culture and serious cross-cultural relationships. Pick the most contextually relevant items from the shortlist. Write natural anchor text in each language — never reuse the raw URL. Avoid duplicates. Avoid pointing to the post itself. Anchor text must be ≤ 70 characters.";

        const userPrompt = JSON.stringify({
          source_post: { slug, category, tags, title_en, title_es },
          shortlist: shortlist.map((c) => ({
            href: c.href,
            kind: c.kind,
            score: c.score,
            ...(c.kind === "post"
              ? {
                  category: c.meta.category,
                  tags: c.meta.tags,
                  title_en: c.meta.title_en,
                  title_es: c.meta.title_es,
                  excerpt_en: (c.meta.excerpt_en ?? "").slice(0, 220),
                  excerpt_es: (c.meta.excerpt_es ?? "").slice(0, 220),
                }
              : {
                  page_label_en: c.meta.en.label,
                  page_label_es: c.meta.es.label,
                  page_topic_en: c.meta.en.topic,
                  page_topic_es: c.meta.es.topic,
                }),
          })),
          how_many: max,
        });

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: userPrompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "return_link_suggestions",
                  description: "Return curated EN + ES internal link suggestions.",
                  parameters: {
                    type: "object",
                    properties: {
                      suggestions_en: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            href: { type: "string" },
                            reason: { type: "string" },
                          },
                          required: ["label", "href", "reason"],
                          additionalProperties: false,
                        },
                      },
                      suggestions_es: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            href: { type: "string" },
                            reason: { type: "string" },
                          },
                          required: ["label", "href", "reason"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["suggestions_en", "suggestions_es"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "return_link_suggestions" } },
          }),
        });

        if (aiRes.status === 429) {
          return json(
            { error: "Rate limits exceeded, please try again later." },
            429,
          );
        }
        if (aiRes.status === 402) {
          return json(
            { error: "Payment required, please add funds to your Lovable AI workspace." },
            402,
          );
        }
        if (!aiRes.ok) {
          const t = await aiRes.text();
          console.error("AI gateway error:", aiRes.status, t);
        } else {
          const json_ = await aiRes.json();
          const call = json_?.choices?.[0]?.message?.tool_calls?.[0];
          const args = call?.function?.arguments;
          if (typeof args === "string") {
            try {
              const parsed = JSON.parse(args);
              suggestions_en = Array.isArray(parsed.suggestions_en) ? parsed.suggestions_en : [];
              suggestions_es = Array.isArray(parsed.suggestions_es) ? parsed.suggestions_es : [];
            } catch (e) {
              console.error("AI tool args parse failed:", e);
            }
          }
        }
      }

      // Fallback: if AI failed or wasn't called, build deterministic labels.
      if (suggestions_en.length === 0 || suggestions_es.length === 0) {
        const fallback = shortlist.slice(0, max);
        const en = fallback.map((c) => ({
          label: c.kind === "post" ? c.meta.title_en : c.meta.en.label,
          href: c.href,
          reason: c.kind === "post"
            ? `Related ${c.meta.category} post`
            : "Relevant site page",
        }));
        const es = fallback.map((c) => ({
          label: c.kind === "post" ? c.meta.title_es : c.meta.es.label,
          href: c.href,
          reason: c.kind === "post"
            ? `Artículo relacionado de ${c.meta.category}`
            : "Página relevante del sitio",
        }));
        if (suggestions_en.length === 0) suggestions_en = en;
        if (suggestions_es.length === 0) suggestions_es = es;
      }

      return json({
        suggestions_en,
        suggestions_es,
        candidates: shortlist.map((c) => ({
          href: c.href,
          kind: c.kind,
          score: c.score,
          label_en: c.kind === "post" ? c.meta.title_en : c.meta.en.label,
          label_es: c.kind === "post" ? c.meta.title_es : c.meta.es.label,
          reason_en: c.kind === "post"
            ? `${c.meta.category ? `Same/related category: ${c.meta.category}. ` : ""}Lexical match score ${c.score}`
            : `Site page: ${c.meta.en.topic}`,
          reason_es: c.kind === "post"
            ? `${c.meta.category ? `Categoría relacionada: ${c.meta.category}. ` : ""}Coincidencia léxica ${c.score}`
            : `Página del sitio: ${c.meta.es.topic}`,
        })),
      });
    } catch (e) {
      console.error("suggest-internal-links error:", e);
      return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
    }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
