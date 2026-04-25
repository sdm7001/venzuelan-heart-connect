import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, BookOpen, ChevronRight, Link2 } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate } from "@/i18n/datetime";
import { supabase } from "@/integrations/supabase/client";
import { useSeo, blogPostingLd, faqLd, breadcrumbLd } from "@/seo/seo";

type Faq = { q: string; a: string };
type Link = { label: string; href: string };

type Post = {
  slug: string;
  category: string;
  reading_minutes: number;
  published_at: string;
  hero_image_url: string | null;
  tags: string[];
  title_en: string; meta_description_en: string; excerpt_en: string;
  body_en: string; faq_en: Faq[]; internal_links_en: Link[];
  title_es: string; meta_description_es: string; excerpt_es: string;
  body_es: string; faq_es: Faq[]; internal_links_es: Link[];
};

const CAT_LABEL: Record<string, { en: string; es: string }> = {
  trust: { en: "Trust & verification", es: "Confianza y verificación" },
  culture: { en: "Culture & language", es: "Cultura e idioma" },
  relationships: { en: "Relationships", es: "Relaciones" },
  safety: { en: "Safety", es: "Seguridad" },
};

export default function ResourceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useI18n();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancel) {
          setPost((data as unknown as Post) ?? null);
          setLoading(false);
        }
      });
    return () => { cancel = true; };
  }, [slug]);

  const title = post ? (lang === "en" ? post.title_en : post.title_es) : "";
  const desc = post ? (lang === "en" ? post.meta_description_en : post.meta_description_es) : "";
  const faqList = post ? ((lang === "en" ? post.faq_en : post.faq_es) ?? []) : [];

  useSeo(
    post
      ? {
          title,
          description: desc,
          path: `/resources/${post.slug}`,
          lang,
          type: "article",
          image: post.hero_image_url ?? undefined,
          feeds: [
            { title: "MatchVenezuelan — Resources (EN)", href: "/rss.xml" },
            { title: "MatchVenezuelan — Recursos (ES)", href: "/rss-es.xml" },
          ],
          article: {
            publishedTime: post.published_at,
            section: CAT_LABEL[post.category]?.[lang] ?? post.category,
            tags: post.tags,
            authorName: "MatchVenezuelan",
          },
          jsonLd: [
            blogPostingLd({
              title,
              description: desc,
              url: `${typeof window !== "undefined" ? window.location.origin : ""}/resources/${post.slug}`,
              lang,
              publishedAt: post.published_at,
              section: CAT_LABEL[post.category]?.[lang] ?? post.category,
              tags: post.tags,
              image: post.hero_image_url ?? undefined,
            }),
            ...(faqList.length > 0 ? [faqLd(faqList)] : []),
            breadcrumbLd([
              { name: lang === "en" ? "Home" : "Inicio", url: "/" },
              { name: lang === "en" ? "Resources" : "Recursos", url: "/resources" },
              { name: title, url: `/resources/${post.slug}` },
            ]),
          ],
        }
      : {
          title: lang === "en" ? "Loading…" : "Cargando…",
          description: "",
          lang,
          robots: "noindex,follow",
        },
    [post?.slug, lang],
  );

  if (loading) {
    return (
      <PublicLayout>
        <div className="container py-24 text-center text-muted-foreground">…</div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl">
            {lang === "en" ? "Article not found" : "Artículo no encontrado"}
          </h1>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/resources">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {lang === "en" ? "Back to resources" : "Volver a recursos"}
            </Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const excerpt = lang === "en" ? post.excerpt_en : post.excerpt_es;
  const body = lang === "en" ? post.body_en : post.body_es;
  const faq = faqList;
  const links = lang === "en" ? post.internal_links_en : post.internal_links_es;
  const catLabel = CAT_LABEL[post.category]?.[lang] ?? post.category;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/resources/${post.slug}` : `/resources/${post.slug}`;
  const shareText = encodeURIComponent(title);
  const shareHref = encodeURIComponent(shareUrl);
  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(lang === "en" ? "Link copied" : "Enlace copiado");
    } catch {
      toast.error(lang === "en" ? "Couldn't copy" : "No se pudo copiar");
    }
  };
  const onNativeShare = async () => {
    const nav = navigator as typeof navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    if (typeof navigator !== "undefined" && nav.share) {
      try {
        await nav.share({ title, text: desc, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      onCopyLink();
    }
  };

  return (
    <PublicLayout>
      <article className="container max-w-3xl py-14 md:py-20">
        <nav
          aria-label={lang === "en" ? "Breadcrumb" : "Migas de pan"}
          className="text-xs text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-foreground">
                {lang === "en" ? "Home" : "Inicio"}
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li>
              <Link to="/resources" className="hover:text-foreground">
                {lang === "en" ? "Resources" : "Recursos"}
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li className="text-foreground/80 line-clamp-1 max-w-[14rem]" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>

        <header className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              <BookOpen className="mr-1 h-3 w-3" /> {catLabel}
            </Badge>
            <time
              dateTime={post.published_at}
              className="text-xs text-muted-foreground"
            >
              {formatDate(post.published_at, lang)}
            </time>
            <span className="text-xs text-muted-foreground">
              · {post.reading_minutes} {lang === "en" ? "min read" : "min de lectura"}
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-burgundy md:text-4xl text-balance">
            {title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            {excerpt}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {lang === "en" ? "Share" : "Compartir"}
            </span>
            <Button asChild size="sm" variant="outline" className="h-8">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareHref}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
              >
                X
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareHref}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                Facebook
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8">
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${shareHref}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                WhatsApp
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareHref}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={onCopyLink}>
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              {lang === "en" ? "Copy link" : "Copiar enlace"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={onNativeShare}>
              {lang === "en" ? "Share…" : "Compartir…"}
            </Button>
          </div>
        </header>

        <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-headings:text-burgundy prose-a:text-primary">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>

        {faq?.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold mb-4">
              {lang === "en" ? "Frequently asked" : "Preguntas frecuentes"}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faq.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {links?.length > 0 && (
          <section className="mt-14 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="font-display text-lg font-semibold mb-3">
              {lang === "en" ? "Keep reading" : "Sigue leyendo"}
            </h2>
            <ul className="space-y-2">
              {links.map((l, i) => (
                <li key={i}>
                  <Link
                    to={l.href}
                    className="text-sm text-primary hover:underline"
                  >
                    → {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </PublicLayout>
  );
}

/* SEO helpers moved to @/seo/seo */
