import { useEffect, useMemo, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, Plus, RefreshCcw, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Severity = "low" | "medium" | "high" | "critical";

type RiskRow = {
  id: string;
  user_id: string | null;
  category: string;
  severity: Severity;
  source: string | null;
  metadata: Record<string, unknown> | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const SEVERITY_FILTERS: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

const SEVERITY_TONE: Record<Severity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  critical: "bg-destructive/15 text-destructive",
};

const CATEGORY_PRESETS = [
  "money_request",
  "off_platform_contact",
  "spam_pattern",
  "duplicate_account",
  "suspicious_login",
  "image_mismatch",
  "policy_violation",
  "other",
];

export default function AdminRiskEvents() {
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [showReviewed, setShowReviewed] = useState(false);
  const [active, setActive] = useState<RiskRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [working, setWorking] = useState(false);

  // Create form state
  const [fUserId, setFUserId] = useState("");
  const [fCategory, setFCategory] = useState("other");
  const [fSeverity, setFSeverity] = useState<Severity>("medium");
  const [fSource, setFSource] = useState("admin_manual");
  const [fNotes, setFNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("risk_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data ?? []) as RiskRow[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      if (!showReviewed && r.reviewed_at) return false;
      return true;
    });
  }, [rows, severityFilter, showReviewed]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    SEVERITIES.forEach(s => { c[s] = rows.filter(r => r.severity === s).length; });
    c.unreviewed = rows.filter(r => !r.reviewed_at).length;
    return c;
  }, [rows]);

  function resetForm() {
    setFUserId("");
    setFCategory("other");
    setFSeverity("medium");
    setFSource("admin_manual");
    setFNotes("");
  }

  async function handleCreate() {
    if (!fCategory.trim()) {
      toast.error("Category is required");
      return;
    }
    setWorking(true);
    const payload: Record<string, unknown> = {
      user_id: fUserId.trim() || null,
      category: fCategory.trim(),
      severity: fSeverity,
      source: fSource.trim() || null,
      metadata: fNotes.trim() ? { notes: fNotes.trim() } : {},
    };
    const { error } = await supabase.from("risk_events").insert(payload);
    setWorking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Risk event created");
    setCreateOpen(false);
    resetForm();
    void load();
  }

  async function markReviewed(row: RiskRow) {
    setWorking(true);
    const me = (await supabase.auth.getUser()).data.user?.id ?? null;
    const { error } = await supabase
      .from("risk_events")
      .update({ reviewed_by: me, reviewed_at: new Date().toISOString() })
      .eq("id", row.id);
    setWorking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marked reviewed");
    setActive(null);
    void load();
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Risk events"
        sub="Internal log of fraud, abuse and policy-risk signals. Moderators and support can create and review events."
        action={
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> New event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create risk event</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium block mb-1">User ID (optional)</label>
                  <Input
                    value={fUserId}
                    onChange={(e) => setFUserId(e.target.value)}
                    placeholder="UUID of the user this event concerns"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Category</label>
                    <Select value={fCategory} onValueChange={setFCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_PRESETS.map(c => (
                          <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Severity</label>
                    <Select value={fSeverity} onValueChange={(v) => setFSeverity(v as Severity)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEVERITIES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Source</label>
                  <Input
                    value={fSource}
                    onChange={(e) => setFSource(e.target.value)}
                    placeholder="e.g. admin_manual, auto_text_scan"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Notes</label>
                  <Textarea
                    value={fNotes}
                    onChange={(e) => setFNotes(e.target.value)}
                    rows={4}
                    placeholder="Context, evidence links, etc."
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={working}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={working}>
                  {working ? "Creating…" : "Create event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {SEVERITY_FILTERS.map(s => (
          <Button
            key={s}
            size="sm"
            variant={severityFilter === s ? "default" : "outline"}
            onClick={() => setSeverityFilter(s)}
          >
            {s} <span className="ml-2 opacity-70">{counts[s] ?? 0}</span>
          </Button>
        ))}
        <Button
          size="sm"
          variant={showReviewed ? "default" : "outline"}
          onClick={() => setShowReviewed(v => !v)}
        >
          {showReviewed ? "Hiding none" : `Hide reviewed (${counts.unreviewed} open)`}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void load()} className="ml-auto">
          <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="No risk events"
          body="Nothing matches the current filter."
        />
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => setActive(r)}
              className="w-full text-left p-4 hover:bg-muted/40 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full uppercase tracking-wide", SEVERITY_TONE[r.severity])}>
                    {r.severity}
                  </span>
                  <span className="font-medium">{r.category.replace(/_/g, " ")}</span>
                  {r.reviewed_at && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> reviewed
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  user: {r.user_id ?? "—"} · source: {r.source ?? "—"} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
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
                  <ShieldAlert className="h-5 w-5" />
                  {active.category.replace(/_/g, " ")}
                </SheetTitle>
                <SheetDescription>
                  Event {active.id.slice(0, 8)} ·{" "}
                  <span className={cn("px-1.5 py-0.5 rounded uppercase text-[10px]", SEVERITY_TONE[active.severity])}>
                    {active.severity}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                <Field label="User">
                  <span className="font-mono text-xs break-all">{active.user_id ?? "—"}</span>
                </Field>
                <Field label="Source">{active.source ?? "—"}</Field>
                <Field label="Created">{new Date(active.created_at).toLocaleString()}</Field>
                <Field label="Reviewed">
                  {active.reviewed_at
                    ? `${new Date(active.reviewed_at).toLocaleString()} by ${active.reviewed_by?.slice(0, 8) ?? "?"}`
                    : "Not yet"}
                </Field>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Metadata</div>
                  <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
{JSON.stringify(active.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                {!active.reviewed_at && (
                  <Button onClick={() => void markReviewed(active)} disabled={working}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Mark reviewed
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
