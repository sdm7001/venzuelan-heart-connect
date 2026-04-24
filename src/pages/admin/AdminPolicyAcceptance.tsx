import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, BellRing, CheckCircle2, History, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { fetchPolicyConfig, PolicyConfig, PolicyKey, DEFAULT_POLICY_CONFIG } from "@/lib/policyConfig";

type ProfileRow = { id: string; display_name: string | null; account_status: string };
type AckRow = { user_id: string; policy_key: string; policy_version: string; accepted_at: string };
type AuditRow = {
  id: string; actor_id: string | null; subject_id: string | null;
  action: string; metadata: any; created_at: string;
};

const POLICY_KEYS: PolicyKey[] = ["tos", "privacy", "aup", "anti_solicitation"];

type Row = {
  user: ProfileRow;
  hasCurrent: boolean;
  acceptedAt: string | null;     // when current-version acceptance completed (latest of the 4)
  acceptedKeys: number;          // count of distinct policies accepted at current version
  missingKeys: PolicyKey[];      // which policies are missing for the active version
  lastPriorAt: string | null;    // most recent acceptance at any prior version
  lastPriorVersion: string | null;
};

export default function AdminPolicyAcceptance() {
  const { user: adminUser } = useAuth();
  const [config, setConfig] = useState<PolicyConfig>(DEFAULT_POLICY_CONFIG);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [acks, setAcks] = useState<AckRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Selection of blocked users for the bulk "send reminder" action.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const cfg = await fetchPolicyConfig();
    setConfig(cfg);

    const [{ data: pData }, { data: aData }, { data: auData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, account_status")
        .eq("onboarding_completed", true)
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("policy_acknowledgements")
        .select("user_id, policy_key, policy_version, accepted_at")
        .order("accepted_at", { ascending: false })
        .limit(5000),
      supabase
        .from("audit_events")
        .select("id, actor_id, subject_id, action, metadata, created_at")
        .eq("category", "policy")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    setProfiles((pData as ProfileRow[]) ?? []);
    setAcks((aData as AckRow[]) ?? []);
    setAudit((auData as AuditRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const rows: Row[] = useMemo(() => {
    const byUser = new Map<string, AckRow[]>();
    for (const a of acks) {
      if (!byUser.has(a.user_id)) byUser.set(a.user_id, []);
      byUser.get(a.user_id)!.push(a);
    }
    return profiles.map(u => {
      const list = byUser.get(u.id) ?? [];
      const current = list.filter(a => a.policy_version === config.policy_version);
      const currentKeys = new Set(current.map(a => a.policy_key));
      const hasCurrent = POLICY_KEYS.every(k => currentKeys.has(k));
      const acceptedAt = hasCurrent
        ? current.map(a => a.accepted_at).sort().slice(-1)[0]
        : null;
      const prior = list.filter(a => a.policy_version !== config.policy_version);
      const lastPrior = prior[0]; // already sorted desc by accepted_at
      return {
        user: u,
        hasCurrent,
        acceptedAt,
        acceptedKeys: currentKeys.size,
        missingKeys: POLICY_KEYS.filter(k => !currentKeys.has(k)),
        lastPriorAt: lastPrior?.accepted_at ?? null,
        lastPriorVersion: lastPrior?.policy_version ?? null,
      };
    });
  }, [profiles, acks, config.policy_version]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.user.display_name ?? "").toLowerCase().includes(q) ||
      r.user.id.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const blocked = filtered.filter(r => !r.hasCurrent);
  const completed = filtered.filter(r => r.hasCurrent);

  const totals = {
    blocked: rows.filter(r => !r.hasCurrent).length,
    completed: rows.filter(r => r.hasCurrent).length,
    total: rows.length,
  };

  // Keep the selection in sync with the visible blocked set — clear out any
  // ids that have since re-accepted or been filtered out so we never send
  // reminders to users who don't need one.
  useEffect(() => {
    const visible = new Set(blocked.map(b => b.user.id));
    setSelected(prev => {
      const next = new Set<string>();
      prev.forEach(id => visible.has(id) && next.add(id));
      return next;
    });
  }, [blocked.map(b => b.user.id).join(",")]);

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAllVisible(check: boolean) {
    setSelected(check ? new Set(blocked.map(b => b.user.id)) : new Set());
  }

  async function sendReminders() {
    if (!adminUser) return;
    const targets = blocked.filter(b => selected.has(b.user.id));
    if (targets.length === 0) return;
    setSending(true);

    // 1) Per-recipient reminder rows — drives the in-app banner the next time
    //    the recipient lands on the dashboard.
    const reminders = targets.map(t => ({
      user_id: t.user.id,
      sent_by: adminUser.id,
      policy_version: config.policy_version,
      missing_keys: t.missingKeys,
      channel: "in_app",
      email_status: null,
    }));
    const { error: remErr } = await supabase.from("policy_reminders").insert(reminders);
    if (remErr) {
      setSending(false);
      return toast.error(`Reminder write failed: ${remErr.message}`);
    }

    // 2) One audit_event per recipient so the history tab shows exactly who
    //    was nudged, by whom, when, and which policies they were missing.
    const events = targets.map(t => ({
      actor_id: adminUser.id,
      subject_id: t.user.id,
      category: "policy",
      action: "policy_reminder_sent",
      metadata: {
        policy_version: config.policy_version,
        missing_keys: t.missingKeys,
        channel: "in_app",
        accepted_keys_at_send: t.acceptedKeys,
      } as any,
    }));
    const { error: auditErr } = await supabase.from("audit_events").insert(events);
    if (auditErr) {
      setSending(false);
      return toast.error(`Audit write failed: ${auditErr.message}`);
    }

    setSelected(new Set());
    setSending(false);
    toast.success(`Reminder sent to ${targets.length} member${targets.length === 1 ? "" : "s"}.`);
    load();
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Policy re-acceptance audit"
        sub={`Active version v${config.policy_version}. Members onboarded before the last bump must re-accept before re-entering the app.`}
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          label="Blocked by re-acceptance"
          value={totals.blocked}
          tone="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label={`Accepted v${config.policy_version}`}
          value={totals.completed}
          tone="emerald"
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          label="Total onboarded members"
          value={totals.total}
        />
      </div>

      <div className="mt-6 mb-3 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or user id"
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="blocked">
        <TabsList>
          <TabsTrigger value="blocked">
            Blocked <Badge variant="secondary" className="ml-2">{blocked.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Re-accepted <Badge variant="secondary" className="ml-2">{completed.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-3.5 w-3.5 mr-1" /> Recent events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked" className="mt-4">
          {blocked.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={selected.size > 0 && selected.size === blocked.length}
                  // Indeterminate isn't a real boolean in shadcn's Checkbox API,
                  // so we just toggle between "all" and "none" based on count.
                  onCheckedChange={(v) => toggleAllVisible(v === true)}
                  aria-label="Select all blocked members"
                />
                <span className="text-muted-foreground">
                  {selected.size === 0
                    ? `Select members to send a re-acceptance reminder`
                    : `${selected.size} of ${blocked.length} selected`}
                </span>
              </div>
              <Button
                size="sm"
                variant="romance"
                onClick={sendReminders}
                disabled={selected.size === 0 || sending}
              >
                <BellRing className="h-4 w-4 mr-1" />
                {sending ? "Sending…" : `Send reminder${selected.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
          <UserTable
            rows={blocked}
            loading={loading}
            mode="blocked"
            activeVersion={config.policy_version}
            selected={selected}
            onToggleSelected={toggleSelected}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <UserTable
            rows={completed}
            loading={loading}
            mode="completed"
            activeVersion={config.policy_version}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent policy events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No policy events recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audit.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "PPp")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">{a.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {a.subject_id ? a.subject_id.slice(0, 8) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.action === "policy_version_bumped" && a.metadata?.next?.policy_version && (
                            <>v{a.metadata.previous?.policy_version ?? "?"} → v{a.metadata.next.policy_version}</>
                          )}
                          {a.action === "policy_urls_updated" && "URLs updated"}
                          {a.action === "policy_reaccepted" && a.metadata?.policy_version && (
                            <>Re-accepted v{a.metadata.policy_version}</>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function StatCard({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: number; tone?: "amber" | "emerald" }) {
  const ring =
    tone === "amber" ? "ring-amber-200" : tone === "emerald" ? "ring-emerald-200" : "ring-border";
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-card ring-1 ${ring}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-burgundy">{value}</div>
    </div>
  );
}

function UserTable({
  rows, loading, mode, activeVersion,
}: { rows: Row[]; loading: boolean; mode: "blocked" | "completed"; activeVersion: string }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {mode === "blocked"
          ? "No members are currently blocked by re-acceptance."
          : "No members have accepted this version yet."}
      </div>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{mode === "blocked" ? "Last accepted" : "Re-accepted"}</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.user.id}>
                <TableCell>
                  <div className="font-medium">{r.user.display_name ?? "—"}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{r.user.id.slice(0, 8)}</div>
                </TableCell>
                <TableCell>
                  {mode === "blocked" ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Blocked · {r.acceptedKeys}/4 accepted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Up to date
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {mode === "completed" && r.acceptedAt ? (
                    <>
                      {format(new Date(r.acceptedAt), "PP")}
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.acceptedAt), { addSuffix: true })}
                      </div>
                    </>
                  ) : r.lastPriorAt ? (
                    <>
                      {format(new Date(r.lastPriorAt), "PP")}
                      <div className="text-[11px] text-muted-foreground">v{r.lastPriorVersion}</div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Never accepted</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {mode === "blocked"
                    ? `Awaiting v${activeVersion}`
                    : `v${activeVersion}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
