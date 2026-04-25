import { useEffect, useMemo, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { BadgeCheck, ShieldCheck, ShieldX, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VerificationStatus =
  | "not_started" | "submitted" | "under_review"
  | "approved" | "rejected" | "needs_more_info";

type Row = {
  id: string;
  user_id: string;
  kind: string | null;
  type: string;
  status: VerificationStatus;
  step: string | null;
  documents: unknown[] | null;
  metadata: Record<string, unknown> | null;
  reviewer_notes: string | null;
  reviewer_decision: string | null;
  submitted_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer_id: string | null;
};

const STATUS_FILTERS: (VerificationStatus | "all")[] = [
  "all", "submitted", "under_review", "needs_more_info", "approved", "rejected",
];

const STATUS_TONE: Record<VerificationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  under_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  needs_more_info: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-destructive/15 text-destructive",
};

export default function AdminVerification() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VerificationStatus | "all">("submitted");
  const [active, setActive] = useState<Row | null>(null);
  const [notes, setNotes] = useState("");
  const [working, setWorking] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    rows.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => filter === "all" ? rows : rows.filter(r => r.status === filter),
    [rows, filter]
  );

  function openDetail(r: Row) {
    setActive(r);
    setNotes(r.reviewer_notes ?? "");
  }

  async function setStatus(next: VerificationStatus) {
    if (!active) return;
    setWorking(true);
    const patch: Record<string, unknown> = {
      status: next,
      reviewer_notes: notes || null,
      reviewer_decision: next,
      reviewer_id: (await supabase.auth.getUser()).data.user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    if (next === "approved" || next === "rejected") {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("verification_requests")
      .update(patch)
      .eq("id", active.id);
    if (error) {
      setWorking(false);
      toast.error(error.message);
      return;
    }

    // If approved and the request has a `kind`, auto-award the badge.
    if (next === "approved" && active.kind) {
      const { error: rpcErr } = await supabase.rpc(
        "award_badge_from_verification",
        { _verification_id: active.id }
      );
      if (rpcErr) {
        toast.error(`Status saved, but badge award failed: ${rpcErr.message}`);
      } else {
        toast.success("Approved and badge awarded");
      }
    } else {
      toast.success(`Marked ${next.replace("_", " ")}`);
    }

    setWorking(false);
    setActive(null);
    void load();
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Verification queue"
        sub="Photo, social, ID, income and Concierge Verified review. Approving auto-awards the matching trust badge."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(s => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s.replace("_", " ")} <span className="ml-2 opacity-70">{counts[s] ?? 0}</span>
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => void load()} className="ml-auto">
          <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck className="h-5 w-5" />}
          title="Nothing in this view"
          body="No verification requests match the current filter."
        />
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => openDetail(r)}
              className="w-full text-left p-4 hover:bg-muted/40 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.kind ?? r.type}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_TONE[r.status])}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  user: {r.user_id} · submitted: {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                {Array.isArray(r.documents) ? r.documents.length : 0} docs
              </Badge>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5" /> {active.kind ?? active.type}
                </SheetTitle>
                <SheetDescription>
                  Request {active.id.slice(0, 8)} · current status:{" "}
                  <span className={cn("px-1.5 py-0.5 rounded", STATUS_TONE[active.status])}>
                    {active.status.replace("_", " ")}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">User</div>
                  <div className="font-mono text-xs break-all">{active.user_id}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Documents</div>
                  {Array.isArray(active.documents) && active.documents.length > 0 ? (
                    <ul className="space-y-1">
                      {active.documents.map((d: unknown, i: number) => (
                        <li key={i} className="text-xs font-mono break-all border border-border rounded px-2 py-1">
                          {typeof d === "string" ? d : JSON.stringify(d)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-muted-foreground">No documents attached.</div>
                  )}
                </div>

                {active.metadata && Object.keys(active.metadata).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Metadata</div>
                    <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
{JSON.stringify(active.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Reviewer notes
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for the audit log…"
                    rows={4}
                  />
                </div>

                {!active.kind && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded p-2">
                    This request has no <code>kind</code> set, so approval will not auto-award a badge.
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={working}
                  onClick={() => void setStatus("under_review")}
                >
                  Under review
                </Button>
                <Button
                  variant="outline"
                  disabled={working}
                  onClick={() => void setStatus("needs_more_info")}
                >
                  Needs info
                </Button>
                <Button
                  variant="destructive"
                  disabled={working}
                  onClick={() => void setStatus("rejected")}
                >
                  <ShieldX className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  disabled={working}
                  onClick={() => void setStatus("approved")}
                >
                  <ShieldCheck className="h-4 w-4 mr-1" /> Approve & award
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
