import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

type PostRow = {
  id: string;
  slug: string;
  category: string;
  title_en: string;
  title_es: string;
  published: boolean;
  featured: boolean;
  updated_at: string;
};

export default function AdminPosts() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id,slug,category,title_en,title_es,published,featured,updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as PostRow[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function remove(id: string, slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    void load();
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Resources"
        sub="Bilingual blog posts (EN + ES)"
        action={
          <Button size="sm" onClick={() => nav("/admin/posts/new")}>
            <Plus className="mr-2 h-4 w-4" /> New post
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Title (EN)</th>
              <th className="px-4 py-3 text-left">Title (ES)</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No posts yet.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                <td className="px-4 py-3">{r.title_en}</td>
                <td className="px-4 py-3">{r.title_es}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    r.published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {r.published ? "Published" : "Draft"}
                  </span>
                  {r.featured && (
                    <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Featured</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/resources/${r.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/admin/posts/${r.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void remove(r.id, r.slug)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
