import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ExternalLink, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { validateLinkEntry } from "@/seo/linkValidation";

type Row = {
  id: string;
  post_id: string;
  lang: "en" | "es";
  label: string;
  href: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
};

type PostInfo = { id: string; slug: string; title_en: string; title_es: string };

export default function AdminLinkSuggestions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [posts, setPosts] = useState<Record<string, PostInfo>>({});
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { label: string; href: string; notes: string }>>({});

  async function load() {
    setLoading(true);
    let q = supabase.from("internal_link_suggestions").select("*").order("created_at", { ascending: false }).limit(500);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as Row[];
    setRows(list);
    const ids = Array.from(new Set(list.map(r => r.post_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("blog_posts").select("id,slug,title_en,title_es").in("id", ids);
      const map: Record<string, PostInfo> = {};
      (ps ?? []).forEach((p: any) => { map[p.id] = p; });
      setPosts(map);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [filter]);

  function getEdit(r: Row) {
    return edits[r.id] ?? { label: r.label, href: r.href, notes: r.review_notes ?? "" };
  }

  function setEdit(id: string, patch: Partial<{ label: string; href: string; notes: string }>) {
    setEdits(e => ({ ...e, [id]: { ...getEdit(rows.find(x => x.id === id)!), ...e[id], ...patch } }));
  }

  async function approve(r: Row) {
    setBusy(r.id);
    try {
      const e = getEdit(r);
      const { data: userRes } = await supabase.auth.getUser();
      // 1) update suggestion row
      const { error: upErr } = await supabase
        .from("internal_link_suggestions")
        .update({
          status: "approved",
          label: e.label,
          href: e.href,
          review_notes: e.notes || null,
          reviewed_by: userRes.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          applied_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      if (upErr) throw upErr;

      // 2) merge into blog_posts.internal_links_<lang>
      const col = r.lang === "en" ? "internal_links_en" : "internal_links_es";
      const { data: post, error: postErr } = await supabase
        .from("blog_posts").select(`id,${col}`).eq("id", r.post_id).single();
      if (postErr) throw postErr;
      const current: any[] = ((post as any)[col] as any[]) ?? [];
      const exists = current.some(l => (l.href ?? "").trim() === e.href.trim());
      const next = exists
        ? current.map(l => (l.href ?? "").trim() === e.href.trim() ? { label: e.label, href: e.href, reason: r.reason ?? undefined } : l)
        : [...current, { label: e.label, href: e.href, reason: r.reason ?? undefined }];
      const update: any = { [col]: next };
      const { error: writeErr } = await supabase.from("blog_posts").update(update).eq("id", r.post_id);
      if (writeErr) throw writeErr;

      toast.success("Approved and merged into post.");
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(r: Row) {
    setBusy(r.id);
    try {
      const e = getEdit(r);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("internal_link_suggestions")
        .update({
          status: "rejected",
          review_notes: e.notes || null,
          reviewed_by: userRes.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      if (error) throw error;
      toast.success("Rejected.");
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  const grouped = useMemo(() => {
    const g: Record<string, Row[]> = {};
    rows.forEach(r => { (g[r.post_id] ||= []).push(r); });
    return g;
  }, [rows]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Internal link suggestions"
        sub="Review AI-suggested internal links before they go live on a post."
        action={
          <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Filter className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No {filter === "all" ? "" : filter} suggestions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([postId, items]) => {
            const p = posts[postId];
            return (
              <section key={postId} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Link to={`/admin/posts/${postId}`} className="font-display text-base font-semibold text-burgundy hover:underline">
                      {p?.title_en || p?.title_es || postId}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{p?.slug ?? "—"} · {items.length} suggestion{items.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {items.map(r => {
                    const e = getEdit(r);
                    return (
                      <div key={r.id} className="rounded-md border border-border p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs">
                          <span className="rounded bg-muted px-2 py-0.5 font-mono uppercase">{r.lang}</span>
                          <span className={`rounded px-2 py-0.5 ${r.status === "pending" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : r.status === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`}>{r.status}</span>
                          {r.reason && <span className="text-muted-foreground italic truncate">“{r.reason}”</span>}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input value={e.label} onChange={ev => setEdit(r.id, { label: ev.target.value })} placeholder="Anchor text" disabled={r.status !== "pending"} />
                          <div className="flex items-center gap-1">
                            <Input value={e.href} onChange={ev => setEdit(r.id, { href: ev.target.value })} placeholder="/resources/slug" disabled={r.status !== "pending"} />
                            <a href={e.href} target="_blank" rel="noreferrer" className="rounded p-1.5 hover:bg-muted"><ExternalLink className="h-3.5 w-3.5" /></a>
                          </div>
                        </div>
                        <Textarea
                          rows={2}
                          className="mt-2 text-xs"
                          value={e.notes}
                          onChange={ev => setEdit(r.id, { notes: ev.target.value })}
                          placeholder="Review notes (optional)"
                          disabled={r.status !== "pending"}
                        />
                        {r.status === "pending" && (
                          <div className="mt-2 flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => void reject(r)} disabled={busy === r.id}>
                              {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />} Reject
                            </Button>
                            <Button size="sm" onClick={() => void approve(r)} disabled={busy === r.id || !e.label.trim() || !e.href.trim()}>
                              {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Approve & merge
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
