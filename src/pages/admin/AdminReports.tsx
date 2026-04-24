import { useEffect, useMemo, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Search } from "lucide-react";
import { ReportStatusBadge, ReportSeverityBadge } from "@/components/admin/ReportBadges";
import { ReportDetailSheet } from "@/components/admin/ReportDetailSheet";
import {
  STATUS_LABEL, type ReportStatus, type ReportSeverity,
} from "@/lib/moderation";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: (ReportStatus | "all")[] = ["all", "new", "in_review", "escalated", "actioned", "closed"];
const SEVERITY_ORDER: ReportSeverity[] = ["critical", "high", "medium", "low"];

export default function AdminReports() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | "all">("all");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, new: 0, in_review: 0, escalated: 0, actioned: 0, closed: 0 };
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter(r => statusFilter === "all" || r.status === statusFilter)
      .filter(r => severityFilter === "all" || r.severity === severityFilter)
      .filter(r => !q || r.category.includes(q.toLowerCase()) || (r.description ?? "").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const sa = SEVERITY_ORDER.indexOf(a.severity);
        const sb = SEVERITY_ORDER.indexOf(b.severity);
        if (sa !== sb) return sa - sb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rows, statusFilter, severityFilter, q]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Reports queue"
        sub="Triage member-submitted reports. Every status change and action requires a note and is audit-logged."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full border border-border px-3 py-1 text-xs font-medium transition-smooth",
              statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]} <span className="ml-1 opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="h-9 rounded-md border border-border bg-card px-2 text-xs"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search category or text" className="h-9 w-56 pl-8 text-xs" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">Loading reports…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Flag className="h-5 w-5" />}
          title={rows.length === 0 ? "No reports yet" : "No reports match these filters"}
          body="Member-submitted reports flow through new → in review → escalated → actioned → closed. Click any row to triage."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-t border-border hover:bg-muted/20"
                  onClick={() => { setActiveId(r.id); setSheetOpen(true); }}
                >
                  <td className="px-4 py-3 font-medium capitalize">{r.category.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.target}</td>
                  <td className="px-4 py-3"><ReportSeverityBadge severity={r.severity} /></td>
                  <td className="px-4 py-3"><ReportStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setActiveId(r.id); setSheetOpen(true); }}>
                      Triage →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReportDetailSheet
        reportId={activeId}
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setActiveId(null); }}
        onChanged={() => void load()}
      />
    </AdminLayout>
  );
}
