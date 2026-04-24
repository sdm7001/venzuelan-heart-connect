import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Save, Trash2, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type LinkSuggestion = { label: string; href: string; reason?: string };

type PostForm = {
  slug: string;
  category: string;
  hero_image_url: string;
  reading_minutes: number;
  tags: string[];
  published: boolean;
  featured: boolean;

  title_en: string;
  meta_description_en: string;
  excerpt_en: string;
  body_en: string;
  faq_en: { question: string; answer: string }[];
  internal_links_en: LinkSuggestion[];

  title_es: string;
  meta_description_es: string;
  excerpt_es: string;
  body_es: string;
  faq_es: { question: string; answer: string }[];
  internal_links_es: LinkSuggestion[];
};

const empty: PostForm = {
  slug: "",
  category: "culture",
  hero_image_url: "",
  reading_minutes: 5,
  tags: [],
  published: false,
  featured: false,
  title_en: "", meta_description_en: "", excerpt_en: "", body_en: "", faq_en: [], internal_links_en: [],
  title_es: "", meta_description_es: "", excerpt_es: "", body_es: "", faq_es: [], internal_links_es: [],
};

export default function AdminPostEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [form, setForm] = useState<PostForm>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id!).maybeSingle();
      if (error) { toast.error(error.message); return; }
      if (!data) { toast.error("Post not found"); nav("/admin/posts"); return; }
      setForm({
        slug: data.slug,
        category: data.category,
        hero_image_url: data.hero_image_url ?? "",
        reading_minutes: data.reading_minutes,
        tags: data.tags ?? [],
        published: data.published,
        featured: data.featured,
        title_en: data.title_en,
        meta_description_en: data.meta_description_en,
        excerpt_en: data.excerpt_en,
        body_en: data.body_en,
        faq_en: (data.faq_en as any) ?? [],
        internal_links_en: (data.internal_links_en as any) ?? [],
        title_es: data.title_es,
        meta_description_es: data.meta_description_es,
        excerpt_es: data.excerpt_es,
        body_es: data.body_es,
        faq_es: (data.faq_es as any) ?? [],
        internal_links_es: (data.internal_links_es as any) ?? [],
      });
      setLoading(false);
      const { count } = await supabase
        .from("internal_link_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id!).eq("status", "pending");
      setPendingCount(count ?? 0);
    })();
  }, [id, isNew, nav]);

  function update<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags.includes(t)) { setTagInput(""); return; }
    update("tags", [...form.tags, t]);
    setTagInput("");
  }

  async function suggestLinks() {
    if (isNew) {
      toast.error("Save the post first, then queue link suggestions for review.");
      return;
    }
    if (!form.title_en && !form.title_es) {
      toast.error("Add a title in EN or ES first.");
      return;
    }
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-internal-links", {
        body: {
          slug: form.slug || undefined,
          category: form.category,
          tags: form.tags,
          title_en: form.title_en,
          body_en: form.body_en,
          title_es: form.title_es,
          body_es: form.body_es,
          limit: 6,
        },
      });
      if (error) throw error;
      const en = (data?.suggestions_en ?? []) as LinkSuggestion[];
      const es = (data?.suggestions_es ?? []) as LinkSuggestion[];
      if (!en.length && !es.length) {
        toast.error("No suggestions returned.");
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const rows = [
        ...en.map(l => ({ post_id: id!, lang: "en" as const, label: l.label, href: l.href, reason: l.reason ?? null, suggested_by: userRes.user?.id ?? null })),
        ...es.map(l => ({ post_id: id!, lang: "es" as const, label: l.label, href: l.href, reason: l.reason ?? null, suggested_by: userRes.user?.id ?? null })),
      ];
      const { error: insErr } = await supabase.from("internal_link_suggestions").insert(rows);
      if (insErr) throw insErr;
      setPendingCount(c => c + rows.length);
      toast.success(`Queued ${en.length} EN + ${es.length} ES suggestions for review.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  async function save() {
    if (!form.slug || !form.title_en || !form.title_es) {
      toast.error("Slug + EN + ES titles are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        category: form.category,
        hero_image_url: form.hero_image_url || null,
        reading_minutes: form.reading_minutes,
        tags: form.tags,
        published: form.published,
        featured: form.featured,
        title_en: form.title_en,
        meta_description_en: form.meta_description_en,
        excerpt_en: form.excerpt_en,
        body_en: form.body_en,
        faq_en: form.faq_en,
        internal_links_en: form.internal_links_en,
        title_es: form.title_es,
        meta_description_es: form.meta_description_es,
        excerpt_es: form.excerpt_es,
        body_es: form.body_es,
        faq_es: form.faq_es,
        internal_links_es: form.internal_links_es,
        published_at: form.published ? new Date().toISOString() : new Date().toISOString(),
      };
      if (isNew) {
        const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").single();
        if (error) throw error;
        toast.success("Post created");
        nav(`/admin/posts/${data.id}`);
      } else {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", id!);
        if (error) throw error;
        toast.success("Post saved");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const linksPreview = useMemo(() => ({
    en: form.internal_links_en,
    es: form.internal_links_es,
  }), [form.internal_links_en, form.internal_links_es]);

  if (loading) {
    return <AdminLayout><div className="py-12 text-center text-muted-foreground">Loading…</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title={isNew ? "New post" : "Edit post"}
        sub="Bilingual editor (English + Spanish)"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void suggestLinks()} disabled={suggesting}>
              {suggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
              Auto-suggest internal links
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Shared metadata */}
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-base font-semibold">Shared</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Slug">
                <Input value={form.slug} onChange={e => update("slug", e.target.value)} placeholder="venezuelan-culture-guide" />
              </Field>
              <Field label="Category">
                <Input value={form.category} onChange={e => update("category", e.target.value)} placeholder="culture" />
              </Field>
              <Field label="Hero image URL">
                <Input value={form.hero_image_url} onChange={e => update("hero_image_url", e.target.value)} placeholder="https://…" />
              </Field>
              <Field label="Reading minutes">
                <Input type="number" min={1} value={form.reading_minutes} onChange={e => update("reading_minutes", Number(e.target.value) || 1)} />
              </Field>
            </div>

            <Field label="Tags">
              <div className="flex flex-wrap gap-2">
                {form.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    {t}
                    <button onClick={() => update("tags", form.tags.filter(x => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex gap-1">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag…"
                    className="h-8 w-32"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </Field>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.published} onCheckedChange={v => update("published", v)} /> Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.featured} onCheckedChange={v => update("featured", v)} /> Featured
              </label>
            </div>
          </section>

          {/* Bilingual content */}
          <Tabs defaultValue="en" className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-4 pt-4">
              <LangFields
                lang="en"
                title={form.title_en} onTitle={v => update("title_en", v)}
                meta={form.meta_description_en} onMeta={v => update("meta_description_en", v)}
                excerpt={form.excerpt_en} onExcerpt={v => update("excerpt_en", v)}
                body={form.body_en} onBody={v => update("body_en", v)}
                faq={form.faq_en} onFaq={v => update("faq_en", v)}
                links={form.internal_links_en} onLinks={v => update("internal_links_en", v)}
              />
            </TabsContent>

            <TabsContent value="es" className="space-y-4 pt-4">
              <LangFields
                lang="es"
                title={form.title_es} onTitle={v => update("title_es", v)}
                meta={form.meta_description_es} onMeta={v => update("meta_description_es", v)}
                excerpt={form.excerpt_es} onExcerpt={v => update("excerpt_es", v)}
                body={form.body_es} onBody={v => update("body_es", v)}
                faq={form.faq_es} onFaq={v => update("faq_es", v)}
                links={form.internal_links_es} onLinks={v => update("internal_links_es", v)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: link suggestions snapshot */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-sm font-semibold">Internal links</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Click "Auto-suggest internal links" to populate both languages from related published posts and core site pages.
            </p>
            <div className="mt-4 space-y-3 text-xs">
              <LinkColumn title="EN" items={linksPreview.en} />
              <LinkColumn title="ES" items={linksPreview.es} />
            </div>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function LangFields(props: {
  lang: "en" | "es";
  title: string; onTitle: (v: string) => void;
  meta: string; onMeta: (v: string) => void;
  excerpt: string; onExcerpt: (v: string) => void;
  body: string; onBody: (v: string) => void;
  faq: { question: string; answer: string }[]; onFaq: (v: { question: string; answer: string }[]) => void;
  links: LinkSuggestion[]; onLinks: (v: LinkSuggestion[]) => void;
}) {
  return (
    <>
      <Field label="Title"><Input value={props.title} onChange={e => props.onTitle(e.target.value)} /></Field>
      <Field label="Meta description"><Textarea rows={2} value={props.meta} onChange={e => props.onMeta(e.target.value)} /></Field>
      <Field label="Excerpt"><Textarea rows={2} value={props.excerpt} onChange={e => props.onExcerpt(e.target.value)} /></Field>
      <Field label="Body (Markdown)"><Textarea rows={14} value={props.body} onChange={e => props.onBody(e.target.value)} className="font-mono text-sm" /></Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">FAQ</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => props.onFaq([...props.faq, { question: "", answer: "" }])}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {props.faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex justify-between gap-2">
              <Input value={f.question} onChange={e => {
                const next = [...props.faq]; next[i] = { ...f, question: e.target.value }; props.onFaq(next);
              }} placeholder="Question" />
              <Button type="button" size="sm" variant="ghost" onClick={() => props.onFaq(props.faq.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea rows={3} value={f.answer} onChange={e => {
              const next = [...props.faq]; next[i] = { ...f, answer: e.target.value }; props.onFaq(next);
            }} placeholder="Answer" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Internal links ({props.lang.toUpperCase()})</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => props.onLinks([...props.links, { label: "", href: "", reason: "" }])}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {props.links.map((l, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_1fr_auto]">
            <Input value={l.label} placeholder="Anchor text" onChange={e => {
              const next = [...props.links]; next[i] = { ...l, label: e.target.value }; props.onLinks(next);
            }} />
            <Input value={l.href} placeholder="/resources/slug" onChange={e => {
              const next = [...props.links]; next[i] = { ...l, href: e.target.value }; props.onLinks(next);
            }} />
            <Button type="button" size="sm" variant="ghost" onClick={() => props.onLinks(props.links.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {props.links.length === 0 && (
          <p className="text-xs text-muted-foreground">No links yet. Use "Auto-suggest internal links" above.</p>
        )}
      </div>
    </>
  );
}

function LinkColumn({ title, items }: { title: string; items: LinkSuggestion[] }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {items.length === 0 ? (
        <div className="mt-1 text-muted-foreground">—</div>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((l, i) => (
            <li key={i} className="truncate">
              <span className="font-medium">{l.label}</span>
              <span className="ml-1 text-muted-foreground">→ {l.href}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
