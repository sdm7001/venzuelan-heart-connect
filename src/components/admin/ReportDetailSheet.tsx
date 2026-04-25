import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportStatusBadge, ReportSeverityBadge, ModeratorActionBadge } from "./ReportBadges";
import {
  ACTIONS, ACTIONS_BY_VALUE, ALLOWED_TRANSITIONS, MIN_NOTE_LENGTH, MAX_NOTE_LENGTH,
  STATUS_LABEL, noteIsValid,
  type ModeratorAction, type ReportStatus,
} from "@/lib/moderation";
import { AlertTriangle, ShieldAlert, Clock, User, Tag, FileText } from "lucide-react";

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  target: string;
  target_id: string | null;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: ReportStatus;
  description: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = {
  id: string;
  action: ModeratorAction;
  notes: string | null;
  created_at: string;
  moderator_id: string;
};

export function ReportDetailSheet({
  reportId, open, onOpenChange, onChanged,
}: {
  reportId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [reporterName, setReporterName] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Status transition form
  const [nextStatus, setNextStatus] = useState<ReportStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Action form
  const [actionValue, setActionValue] = useState<ModeratorAction | "">("");
  const [actionNote, setActionNote] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    if (!open || !reportId) return;
    void load(reportId);
  }, [open, reportId]);

  async function load(id: string) {
    setLoading(true);
    setReport(null);
    setHistory([]);
    setReporterName(""); setTargetName("");
    setNextStatus(""); setStatusNote("");
    setActionValue(""); setActionNote("");

    const { data: r, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
    if (error || !r) {
      toast.error(error?.message ?? "Report not found");
      setLoading(false);
      return;
    }
    setReport(r as Report);

    const ids = [r.reporter_id, r.reported_user_id].filter(Boolean) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      const map = new Map((profs ?? []).map(p => [p.id, p.display_name ?? "—"]));
      setReporterName(map.get(r.reporter_id) ?? "—");
      if (r.reported_user_id) setTargetName(map.get(r.reported_user_id) ?? "—");
    }

    const { data: hist } = await supabase
      .from("moderation_actions")
      .select("id,action,notes,created_at,moderator_id")
      .eq("report_id", id)
      .order("created_at", { ascending: false });
    setHistory((hist ?? []) as HistoryRow[]);

    setLoading(false);
  }

  const allowedNext = useMemo(
    () => (report ? ALLOWED_TRANSITIONS[report.status] : []),
    [report]
  );

  async function handleAssignToMe() {
    if (!report || !user) return;
    const { error } = await supabase
      .from("reports")
      .update({ assigned_to: user.id, status: report.status === "new" ? "in_review" : report.status })
      .eq("id", report.id);
    if (error) return toast.error(error.message);
    await supabase.from("audit_events").insert({
      actor_id: user.id, subject_id: report.reported_user_id, category: "moderation",
      action: "report_claimed", metadata: { report_id: report.id },
    });
    toast.success("Assigned to you.");
    await load(report.id); onChanged();
  }

  async function handleStatusChange() {
    if (!report || !user || !nextStatus) return;
    if (!noteIsValid(statusNote)) return toast.error(`Note must be ${MIN_NOTE_LENGTH}–${MAX_NOTE_LENGTH} characters.`);
    setSavingStatus(true);

    const { error: updErr } = await supabase
      .from("reports")
      .update({ status: nextStatus })
      .eq("id", report.id);
    if (updErr) { setSavingStatus(false); return toast.error(updErr.message); }

    await supabase.from("moderation_actions").insert({
      report_id: report.id,
      target_user_id: report.reported_user_id,
      moderator_id: user.id,
      action: "add_note",
      notes: `[status: ${report.status} → ${nextStatus}] ${statusNote.trim()}`,
    });

    await supabase.from("audit_events").insert({
      actor_id: user.id, subject_id: report.reported_user_id, category: "moderation",
      action: "report_status_changed",
      metadata: { report_id: report.id, from: report.status, to: nextStatus, note: statusNote.trim() },
    });

    setSavingStatus(false);
    toast.success(`Status updated to ${STATUS_LABEL[nextStatus]}.`);
    await load(report.id); onChanged();
  }

  async function handleApplyAction() {
    if (!report || !user || !actionValue) return;
    if (!noteIsValid(actionNote)) return toast.error(`Note must be ${MIN_NOTE_LENGTH}–${MAX_NOTE_LENGTH} characters.`);
    const def = ACTIONS_BY_VALUE[actionValue];
    if (def.tone === "danger" && !isAdmin) return toast.error("Only admins can apply this action.");

    setSavingAction(true);

    const { error: actErr } = await supabase.from("moderation_actions").insert({
      report_id: report.id,
      target_user_id: report.reported_user_id,
      moderator_id: user.id,
      action: def.value,
      notes: actionNote.trim(),
    });
    if (actErr) { setSavingAction(false); return toast.error(actErr.message); }

    if (def.value !== "add_note") {
      await supabase.from("reports").update({ status: def.resultingStatus }).eq("id", report.id);
    }

    if (def.setsAccountStatus && report.reported_user_id) {
      const { error: psErr } = await supabase.from("profiles")
        .update({ account_status: def.setsAccountStatus })
        .eq("id", report.reported_user_id);
      if (psErr) toast.error(`Action recorded but account status update failed: ${psErr.message}`);
    }

    await supabase.from("audit_events").insert({
      actor_id: user.id, subject_id: report.reported_user_id, category: "moderation",
      action: `report_action_${def.value}`,
      metadata: {
        report_id: report.id,
        action: def.value,
        resulting_status: def.resultingStatus,
        account_status_set: def.setsAccountStatus ?? null,
        note: actionNote.trim(),
      },
    });

    setSavingAction(false);
    toast.success(`${def.label} applied.`);
    setActionValue(""); setActionNote("");
    await load(report.id); onChanged();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            {report ? `Report · ${report.category.replace(/_/g, " ")}` : "Report"}
          </SheetTitle>
          <SheetDescription>
            All status changes and actions require a note and are written to the audit log.
          </SheetDescription>
        </SheetHeader>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

        {report && !loading && (
          <div className="mt-6 space-y-6">
            <section className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <ReportStatusBadge status={report.status} />
                <ReportSeverityBadge severity={report.severity} />
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {new Date(report.created_at).toLocaleString()}
                </span>
              </div>
              <div className="grid gap-1 pt-2 text-xs">
                <Row icon={<Tag className="h-3 w-3" />} label="Target">{report.target}{report.target_id ? ` · ${report.target_id.slice(0, 8)}…` : ""}</Row>
                <Row icon={<User className="h-3 w-3" />} label="Reporter">{reporterName || report.reporter_id.slice(0, 8) + "…"}</Row>
                <Row icon={<User className="h-3 w-3" />} label="Reported user">{targetName || (report.reported_user_id ? report.reported_user_id.slice(0, 8) + "…" : "—")}</Row>
                <Row icon={<FileText className="h-3 w-3" />} label="Assigned to">{report.assigned_to ? report.assigned_to.slice(0, 8) + "…" : "Unassigned"}</Row>
              </div>
              {report.description && (
                <>
                  <Separator className="my-3" />
                  <p className="whitespace-pre-wrap text-sm text-foreground">{report.description}</p>
                </>
              )}
              {report.assigned_to !== user?.id && (
                <Button size="sm" variant="outline" className="mt-3" onClick={handleAssignToMe}>
                  Assign to me
                </Button>
              )}
            </section>

            <Tabs defaultValue="action">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="action">Apply action</TabsTrigger>
                <TabsTrigger value="status">Change status</TabsTrigger>
                <TabsTrigger value="history">History ({history.length})</TabsTrigger>
              </TabsList>

              {/* APPLY ACTION */}
              <TabsContent value="action" className="space-y-3 pt-4">
                <Label>Moderator action</Label>
                <Select value={actionValue} onValueChange={(v) => setActionValue(v as ModeratorAction)}>
                  <SelectTrigger><SelectValue placeholder="Choose an action…" /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value} disabled={a.tone === "danger" && !isAdmin}>
                        {a.label}{a.tone === "danger" && !isAdmin ? " · admin only" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {actionValue && (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <p>{ACTIONS_BY_VALUE[actionValue].description}</p>
                    <p className="mt-2">
                      Report status will become <span className="font-semibold text-foreground">{STATUS_LABEL[ACTIONS_BY_VALUE[actionValue].resultingStatus]}</span>
                      {ACTIONS_BY_VALUE[actionValue].setsAccountStatus && <> · account status will be set to <span className="font-semibold text-foreground">{ACTIONS_BY_VALUE[actionValue].setsAccountStatus}</span></>}
                      .
                    </p>
                    {ACTIONS_BY_VALUE[actionValue].tone === "danger" && (
                      <p className="mt-2 flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Sensitive action — admin only and irreversible in some cases.
                      </p>
                    )}
                  </div>
                )}
                <Label htmlFor="action-note">Note to record (required, {MIN_NOTE_LENGTH}–{MAX_NOTE_LENGTH} chars)</Label>
                <Textarea
                  id="action-note" rows={4} maxLength={MAX_NOTE_LENGTH}
                  placeholder="Explain the evidence and decision. Auditors will read this."
                  value={actionNote} onChange={e => setActionNote(e.target.value)}
                />
                <p className="text-right text-xs text-muted-foreground">{actionNote.trim().length}/{MAX_NOTE_LENGTH}</p>
                <Button
                  className="w-full"
                  variant={actionValue && ACTIONS_BY_VALUE[actionValue].tone === "danger" ? "destructive" : "default"}
                  disabled={!actionValue || !noteIsValid(actionNote) || savingAction}
                  onClick={handleApplyAction}
                >
                  {savingAction ? "Applying…" : "Apply action"}
                </Button>
              </TabsContent>

              {/* CHANGE STATUS */}
              <TabsContent value="status" className="space-y-3 pt-4">
                <Label>Move report to</Label>
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ReportStatus)}>
                  <SelectTrigger><SelectValue placeholder="Choose next status…" /></SelectTrigger>
                  <SelectContent>
                    {allowedNext.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                    {allowedNext.length === 0 && <SelectItem value="" disabled>No transitions available</SelectItem>}
                  </SelectContent>
                </Select>
                <Label htmlFor="status-note">Reason for status change (required)</Label>
                <Textarea
                  id="status-note" rows={3} maxLength={MAX_NOTE_LENGTH}
                  placeholder={`Why is this report moving from ${STATUS_LABEL[report.status]}?`}
                  value={statusNote} onChange={e => setStatusNote(e.target.value)}
                />
                <p className="text-right text-xs text-muted-foreground">{statusNote.trim().length}/{MAX_NOTE_LENGTH}</p>
                <Button
                  className="w-full"
                  disabled={!nextStatus || !noteIsValid(statusNote) || savingStatus}
                  onClick={handleStatusChange}
                >
                  {savingStatus ? "Saving…" : "Update status"}
                </Button>
              </TabsContent>

              {/* HISTORY */}
              <TabsContent value="history" className="space-y-3 pt-4">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No actions on this report yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {history.map(h => (
                      <li key={h.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <ModeratorActionBadge action={h.action} />
                          <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        {h.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{h.notes}</p>}
                        <p className="mt-2 text-[11px] text-muted-foreground">by {h.moderator_id.slice(0, 8)}…</p>
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="opacity-70">{icon}</span>
      <span className="w-28 shrink-0">{label}</span>
      <span className="truncate text-foreground">{children}</span>
    </div>
  );
}
