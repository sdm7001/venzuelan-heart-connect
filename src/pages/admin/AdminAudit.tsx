import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Search, RefreshCcw, Download, ChevronDown, ChevronRight } from "lucide-react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  created_at: string;
  category: string;
  action: string;
  actor_id: string | null;
  subject_id: string | null;
  metadata: Record<string, unknown> | null;
};

const CATEGORIES = ["all", "auth", "admin", "moderation", "verification", "policy", "billing"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const ACTION_GROUPS: Record<string, { label: string; tone: string; matches: (a: string) => boolean }> = {
  view: {
    label: "View",
    tone: "bg-muted text-muted-foreground",
    matches: (a) => a.includes("viewed") || a.includes("opened") || a === "report_claimed",
  },
  impersonate: {
    label: "Impersonate",
    tone: "bg-warning/15 text-warning",
    matches: (a) => a.startsWith("impersonation_"),
  },
  update: {
    label: "Update",
    tone: "bg-info/15 text-info",
    matches: (a) =>
      a.includes("status_changed") ||
      a.includes("updated") ||
      a.startsWith("staff_otp_") ||
      a.startsWith("report_action_"),
  },
  resolve: {
    label: "Resolve",
    tone: "bg-success/15 text-success",
    matches: (a) =>
      a.includes("resolved") ||
      a.includes("closed") ||
      a === "badge_awarded" ||
      a === "verification_decided",
  },
};

function actionGroup(action: string) {
  for (const [key, g] of Object.entries(ACTION_GROUPS)) {
    if (g.matches(action)) return key;
  }
  return null;
}

const GROUP_FILTERS = ["all", ...Object.keys(ACTION_GROUPS)] as const;
type GroupFilter = (typeof GROUP_FILTERS)[number];

const PAGE_SIZE = 100;

export default function AdminAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(p = 0) {
    setLoading(true);
    let query = supabase
      .from("audit_events")
      .select("id,created_at,category,action,actor_id,subject_id,metadata")
      .order("created_at", { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
    if (category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const slice = (data ?? []) as AuditRow[];
    setHasMore(slice.length > PAGE_SIZE);
    const pageRows = slice.slice(0, PAGE_SIZE);
    setRows(pageRows);

    // Load actor + subject names in one batch
    const ids = Array.from(
      new Set(pageRows.flatMap((r) => [r.actor_id, r.subject_id]).filter(Boolean) as string[]),
    );
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p) => { map[p.id] = p.display_name ?? "—"; });
      setProfiles(map);
    } else {
      setProfiles({});
    }
    setLoading(false);
  }

  useEffect(() => { setPage(0); void load(0); /* eslint-disable-next-line */ }, [category]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => group === "all" || actionGroup(r.action) === group)
      .filter((r) => {
        if (!q) return true;
        const needle = q.toLowerCase();
        return (
          r.action.toLowerCase().includes(needle) ||
          r.category.toLowerCase().includes(needle) ||
          (r.actor_id ?? "").includes(needle) ||
          (r.subject_id ?? "").includes(needle) ||
          (profiles[r.actor_id ?? ""] ?? "").toLowerCase().includes(needle) ||
          (profiles[r.subject_id ?? ""] ?? "").toLowerCase().includes(needle) ||
          JSON.stringify(r.metadata ?? {}).toLowerCase().includes(needle)
        );
      });
  }, [rows, group, q, profiles]);

  function exportCsv() {
    const header = ["timestamp", "category", "action", "actor_id", "actor_name", "subject_id", "subject_name", "metadata"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const cells = [
        r.created_at,
        r.category,
        r.action,
        r.actor_id ?? "",
        (profiles[r.actor_id ?? ""] ?? "").replace(/,/g, " "),
        r.subject_id ?? "",
        (profiles[r.subject_id ?? ""] ?? "").replace(/,/g, " "),
        JSON.stringify(r.metadata ?? {}).replace(/"/g, '""'),
      ];
      lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Audit log"
        sub="Append-only history of staff and system actions. Every entry includes the actor, subject, and a precise timestamp."
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void load(page)}>
              <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
          <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-1">
          {GROUP_FILTERS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "rounded-full border border-border px-3 py-1 text-xs font-medium transition-smooth",
                group === g
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {g === "all" ? "All actions" : ACTION_GROUPS[g].label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, name, id, metadata"
            className="h-9 w-72 pl-8 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading audit events…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title={rows.length === 0 ? "No audit events yet" : "No events match these filters"}
          body="Every signup, role grant, moderation action, verification decision, impersonation session and policy acknowledgement is recorded here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-8 px-2 py-3" />
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Subject</th>
              </tr>
            </thead>
            {filtered.map((r) => {
              const isOpen = expanded === r.id;
              const grp = actionGroup(r.action);
              return (
                <tbody key={r.id}>
                  <tr
                    className="cursor-pointer border-t border-border hover:bg-muted/20"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <td className="px-2 py-3 text-muted-foreground">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-0 bg-muted text-xs capitalize">
                        {r.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          grp ? ACTION_GROUPS[grp].tone : "bg-muted text-muted-foreground",
                        )}
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActorCell id={r.actor_id} name={profiles[r.actor_id ?? ""]} />
                    </td>
                    <td className="px-4 py-3">
                      <ActorCell id={r.subject_id} name={profiles[r.subject_id ?? ""]} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-border bg-muted/20">
                      <td />
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="text-xs text-muted-foreground">
                            <div className="mb-1 font-semibold uppercase tracking-wider">Event</div>
                            <div>id: <code className="font-mono">{r.id}</code></div>
                            <div>iso: <code className="font-mono">{r.created_at}</code></div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Metadata
                            </div>
                            {r.metadata && Object.keys(r.metadata).length > 0 ? (
                              <pre className="max-h-64 overflow-auto rounded-md bg-card p-2 text-[11px] leading-snug text-foreground">
{JSON.stringify(r.metadata, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-muted-foreground">No metadata.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} of {rows.length} loaded · page {page + 1}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0 || loading}
            onClick={() => { const p = page - 1; setPage(p); void load(p); }}
          >
            ← Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasMore || loading}
            onClick={() => { const p = page + 1; setPage(p); void load(p); }}
          >
            Next →
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

function ActorCell({ id, name }: { id: string | null; name?: string }) {
  if (!id) return <span className="text-xs text-muted-foreground">system</span>;
  return (
    <Link
      to={`/admin/users/${id}`}
      onClick={(e) => e.stopPropagation()}
      className="group inline-flex flex-col"
      title={id}
    >
      <span className="text-xs font-medium text-foreground group-hover:underline">
        {name || id.slice(0, 8) + "…"}
      </span>
      {name && <span className="font-mono text-[10px] text-muted-foreground">{id.slice(0, 8)}…</span>}
    </Link>
  );
}
