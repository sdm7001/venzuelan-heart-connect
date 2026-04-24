import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye, Settings2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ImpersonateDialog } from "@/components/admin/ImpersonateDialog";

export default function AdminUsers() {
  const { isAdmin, user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  const filtered = rows.filter(r =>
    !q || (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || (r.country ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AdminLayout>
      <AdminPageHeader title="Users" sub={`${rows.length} member${rows.length === 1 ? "" : "s"}`} />
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or country" className="pl-9" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Gender</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Intent</th>
              <th className="px-4 py-3 text-left">Lang</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">{r.display_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.gender ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.relationship_intention ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground uppercase">{r.preferred_language}</td>
                <td className="px-4 py-3"><StatusBadge status={r.account_status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" title="Open management panel">
                        <Link to={`/admin/users/${r.id}`}>
                          <Settings2 className="mr-1 h-3.5 w-3.5" /> Manage
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={r.id === user?.id}
                        title={r.id === user?.id ? "Cannot impersonate yourself" : "Start a read-only view-as session"}
                        onClick={() => setTarget({ id: r.id, name: r.display_name ?? "Unnamed user" })}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> View as
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-muted-foreground">No members yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ImpersonateDialog
        open={!!target}
        onOpenChange={(o) => { if (!o) setTarget(null); }}
        target={target}
      />
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success",
    restricted: "bg-warning/15 text-warning",
    suspended: "bg-destructive/15 text-destructive",
    banned: "bg-destructive/20 text-destructive",
    pending_verification: "bg-info/15 text-info",
  };
  return <Badge variant="outline" className={`border-0 ${map[status] ?? ""}`}>{status}</Badge>;
}
