import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, BellRing, CheckCircle2,
  ChevronLeft, ChevronRight, Download, History, RefreshCw, Search, ShieldCheck,
} from "lucide-react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { fetchPolicyConfig, PolicyConfig, PolicyKey, DEFAULT_POLICY_CONFIG } from "@/lib/policyConfig";

type AuditRow = {
  id: string; actor_id: string | null; subject_id: string | null;
  action: string; metadata: any; created_at: string;
};

type AggRow = {
  user_id: string;
  display_name: string | null;
  account_status: string;
  has_current: boolean;
  accepted_keys: number;
  missing_keys: PolicyKey[];
  accepted_at: string | null;
  last_prior_at: string | null;
  last_prior_version: string | null;
};

type SortField = "name" | "accepted_at" | "missing_count";
type SortDir = "asc" | "desc";
type Mode = "blocked" | "completed";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

// RFC 4180 escape: wrap in quotes if the value contains a comma, quote, or newline.
function csvCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export default function AdminPolicyAcceptance() {
  const { user: adminUser } = useAuth();
  const [config, setConfig] = useState<PolicyConfig>(DEFAULT_POLICY_CONFIG);
  const [audit, setAudit] = useState<AuditRow[]>([]);

  // Per-tab paging/sort state, kept independent so switching tabs doesn't
  // wipe the user's place on the other one.
  const [activeTab, setActiveTab] = useState<Mode>("blocked");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState(50);

  const [blockedState, setBlockedState] = useState({
    page: 1, sortField: "missing_count" as SortField, sortDir: "desc" as SortDir,
    rows: [] as AggRow[], total: 0, pageCount: 1, loading: true,
  });
  const [completedState, setCompletedState] = useState({
    page: 1, sortField: "accepted_at" as SortField, sortDir: "desc" as SortDir,
    rows: [] as AggRow[], total: 0, pageCount: 1, loading: true,
  });
  const [totals, setTotals] = useState({ blocked: 0, completed: 0, total: 0 });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Debounce search input to keep typing snappy without hammering the function.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load policy config + audit once.
  useEffect(() => {
    fetchPolicyConfig().then(setConfig);
    supabase
      .from("audit_events")
      .select("id, actor_id, subject_id, action, metadata, created_at")
      .eq("category", "policy")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setAudit((data as AuditRow[]) ?? []));
  }, []);

  const loadPage = useCallback(
    async (mode: Mode) => {
      const setState = mode === "blocked" ? setBlockedState : setCompletedState;
      const state = mode === "blocked" ? blockedState : completedState;
      setState((s) => ({ ...s, loading: true }));
      const { data, error } = await supabase.functions.invoke("admin-policy-aggregate", {
        body: {
          mode,
          page: state.page,
          pageSize,
          search: debouncedSearch,
          sortField: state.sortField,
          sortDir: state.sortDir,
          policyVersion: config.policy_version,
        },
      });
      if (error || data?.error) {
        toast.error(`Load failed: ${(error?.message ?? data?.error) || "unknown"}`);
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      setState((s) => ({
        ...s,
        rows: data.rows ?? [],
        total: data.total ?? 0,
        pageCount: data.pageCount ?? 1,
        loading: false,
      }));
      if (data.totals) setTotals(data.totals);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageSize, debouncedSearch, config.policy_version,
     blockedState.page, blockedState.sortField, blockedState.sortDir,
     completedState.page, completedState.sortField, completedState.sortDir],
  );

  // Refetch the active tab whenever its inputs change.
  useEffect(() => { loadPage(activeTab); }, [activeTab, loadPage]);

  // Reset to page 1 when search or page size changes.
  useEffect(() => {
    setBlockedState((s) => ({ ...s, page: 1 }));
    setCompletedState((s) => ({ ...s, page: 1 }));
  }, [debouncedSearch, pageSize]);

  function refresh() {
    loadPage(activeTab);
  }

  // Selection only ever applies to the blocked rows currently on screen.
  useEffect(() => {
    const visible = new Set(blockedState.rows.map((r) => r.user_id));
    setSelected((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => visible.has(id) && next.add(id));
      return next;
    });
  }, [blockedState.rows]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAllVisible(check: boolean) {
    setSelected(check ? new Set(blockedState.rows.map((r) => r.user_id)) : new Set());
  }

  async function sendReminders() {
    if (!adminUser) return;
    const targets = blockedState.rows.filter((r) => selected.has(r.user_id));
    if (targets.length === 0) return;
    setSending(true);

    const reminders = targets.map((t) => ({
      user_id: t.user_id,
      sent_by: adminUser.id,
      policy_version: config.policy_version,
      missing_keys: t.missing_keys,
      channel: "in_app",
      email_status: null,
    }));
    const { error: remErr } = await supabase.from("policy_reminders").insert(reminders);
    if (remErr) {
      setSending(false);
      return toast.error(`Reminder write failed: ${remErr.message}`);
    }

    const events = targets.map((t) => ({
      actor_id: adminUser.id,
      subject_id: t.user_id,
      category: "policy",
      action: "policy_reminder_sent",
      metadata: {
        policy_version: config.policy_version,
        missing_keys: t.missing_keys,
        channel: "in_app",
        accepted_keys_at_send: t.accepted_keys,
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
    refresh();
  }

  // Pulls the entire filtered set (no pagination) and downloads it as CSV.
  // Member id, display name, last accepted version + timestamps are all included.
  const [exporting, setExporting] = useState<Mode | null>(null);
  async function exportCsv(mode: Mode) {
    setExporting(mode);
    const state = mode === "blocked" ? blockedState : completedState;
    const { data, error } = await supabase.functions.invoke("admin-policy-aggregate", {
      body: {
        mode,
        all: true,
        search: debouncedSearch,
        sortField: state.sortField,
        sortDir: state.sortDir,
        policyVersion: config.policy_version,
      },
    });
    setExporting(null);
    if (error || data?.error) {
      return toast.error(`Export failed: ${(error?.message ?? data?.error) || "unknown"}`);
    }
    const rows: AggRow[] = data.rows ?? [];
    if (rows.length === 0) return toast.info("Nothing to export for the current filter.");

    const headers = [
      "user_id",
      "display_name",
      "account_status",
      "status",
      "current_policy_version",
      "current_accepted_at",
      "last_accepted_version",
      "last_accepted_at",
      "missing_keys",
      "accepted_keys_count",
    ];
    const lines = [headers.join(",")];
    for (const r of rows) {
      const lastVersion = r.has_current ? config.policy_version : (r.last_prior_version ?? "");
      const lastAt = r.has_current ? (r.accepted_at ?? "") : (r.last_prior_at ?? "");
      lines.push([
        r.user_id,
        r.display_name ?? "",
        r.account_status,
        r.has_current ? "up_to_date" : "blocked",
        config.policy_version,
        r.accepted_at ?? "",
        lastVersion,
        lastAt,
        r.missing_keys.join("|"),
        String(r.accepted_keys),
      ].map(csvCell).join(","));
    }
    const csv = "\uFEFF" + lines.join("\n"); // BOM keeps Excel happy with UTF-8
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-${mode}-v${config.policy_version}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} ${mode === "blocked" ? "blocked" : "re-accepted"} member${rows.length === 1 ? "" : "s"}.`);
  }
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Policy re-acceptance audit"
        sub={`Active version v${config.policy_version}. Members onboarded before the last bump must re-accept before re-entering the app.`}
        action={
          <Button variant="outline" size="sm" onClick={refresh}
            disabled={blockedState.loading || completedState.loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${(blockedState.loading || completedState.loading) ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          label="Blocked by re-acceptance" value={totals.blocked} tone="amber" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label={`Accepted v${config.policy_version}`} value={totals.completed} tone="emerald" />
        <StatCard icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          label="Total onboarded members" value={totals.total} />
      </div>

      <div className="mt-6 mb-3 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or user id" className="pl-8" />
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Mode)}>
        <TabsList>
          <TabsTrigger value="blocked">
            Blocked <Badge variant="secondary" className="ml-2">{totals.blocked}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Re-accepted <Badge variant="secondary" className="ml-2">{totals.completed}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-3.5 w-3.5 mr-1" /> Recent events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked" className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-3 text-sm">
              {blockedState.rows.length > 0 && (
                <>
                  <Checkbox
                    checked={selected.size > 0 && selected.size === blockedState.rows.length}
                    onCheckedChange={(v) => toggleAllVisible(v === true)}
                    aria-label="Select all blocked members on this page"
                  />
                  <span className="text-muted-foreground">
                    {selected.size === 0
                      ? `Select members to send a re-acceptance reminder`
                      : `${selected.size} of ${blockedState.rows.length} on this page selected`}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => exportCsv("blocked")}
                disabled={exporting === "blocked" || totals.blocked === 0}>
                <Download className="h-4 w-4 mr-1" />
                {exporting === "blocked" ? "Preparing…" : "Export CSV"}
              </Button>
              <Button size="sm" variant="romance" onClick={sendReminders}
                disabled={selected.size === 0 || sending}>
                <BellRing className="h-4 w-4 mr-1" />
                {sending ? "Sending…" : `Send reminder${selected.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
          <UserTable
            mode="blocked"
            activeVersion={config.policy_version}
            state={blockedState}
            onSort={(field) =>
              setBlockedState((s) => ({
                ...s, page: 1,
                sortDir: s.sortField === field && s.sortDir === "desc" ? "asc" : "desc",
                sortField: field,
              }))
            }
            onPage={(page) => setBlockedState((s) => ({ ...s, page }))}
            selected={selected}
            onToggleSelected={toggleSelected}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => exportCsv("completed")}
              disabled={exporting === "completed" || totals.completed === 0}>
              <Download className="h-4 w-4 mr-1" />
              {exporting === "completed" ? "Preparing…" : "Export CSV"}
            </Button>
          </div>
          <UserTable
            mode="completed"
            activeVersion={config.policy_version}
            state={completedState}
            onSort={(field) =>
              setCompletedState((s) => ({
                ...s, page: 1,
                sortDir: s.sortField === field && s.sortDir === "desc" ? "asc" : "desc",
                sortField: field,
              }))
            }
            onPage={(page) => setCompletedState((s) => ({ ...s, page }))}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent policy events</CardTitle></CardHeader>
            <CardContent>
              {audit.length === 0 ? (
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
                    {audit.map((a) => (
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
                          {a.action === "policy_reminder_sent" && (
                            <>
                              Reminder for v{a.metadata?.policy_version ?? "?"} ·{" "}
                              <span className="font-mono">{(a.metadata?.missing_keys ?? []).join(", ") || "—"}</span>
                              {a.metadata?.channel ? <> · {a.metadata.channel}</> : null}
                            </>
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

function StatCard({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: number; tone?: "amber" | "emerald";
}) {
  const ring = tone === "amber" ? "ring-amber-200" : tone === "emerald" ? "ring-emerald-200" : "ring-border";
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

function SortHeader({
  label, field, current, dir, onClick,
}: {
  label: string; field: SortField; current: SortField; dir: SortDir;
  onClick: (f: SortField) => void;
}) {
  const Icon = current !== field ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onClick(field)}
      className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
    >
      {label} <Icon className="h-3 w-3" />
    </button>
  );
}

function UserTable({
  mode, activeVersion, state, onSort, onPage, selected, onToggleSelected,
}: {
  mode: Mode;
  activeVersion: string;
  state: {
    page: number; sortField: SortField; sortDir: SortDir;
    rows: AggRow[]; total: number; pageCount: number; loading: boolean;
  };
  onSort: (f: SortField) => void;
  onPage: (page: number) => void;
  selected?: Set<string>;
  onToggleSelected?: (id: string) => void;
}) {
  const showSelect = mode === "blocked" && !!onToggleSelected;
  const { rows, loading, page, pageCount, total, sortField, sortDir } = state;
  const dateLabel = mode === "blocked" ? "Last accepted" : "Re-accepted";

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelect && <TableHead className="w-10" />}
              <TableHead>
                <SortHeader label="Member" field="name" current={sortField} dir={sortDir} onClick={onSort} />
              </TableHead>
              <TableHead>
                {mode === "blocked" ? (
                  <SortHeader label="Status" field="missing_count" current={sortField} dir={sortDir} onClick={onSort} />
                ) : "Status"}
              </TableHead>
              <TableHead>
                <SortHeader label={dateLabel} field="accepted_at" current={sortField} dir={sortDir} onClick={onSort} />
              </TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={showSelect ? 5 : 4} className="text-sm text-muted-foreground py-8 text-center">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showSelect ? 5 : 4} className="text-sm text-muted-foreground py-8 text-center">
                  {mode === "blocked"
                    ? "No members are currently blocked by re-acceptance."
                    : "No members have accepted this version yet."}
                </TableCell>
              </TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.user_id} data-state={selected?.has(r.user_id) ? "selected" : undefined}>
                {showSelect && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selected?.has(r.user_id) ?? false}
                      onCheckedChange={() => onToggleSelected!(r.user_id)}
                      aria-label={`Select ${r.display_name ?? r.user_id.slice(0, 8)}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Link
                    to={`/admin/users/${r.user_id}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {r.display_name ?? "—"}
                  </Link>
                  <div className="font-mono text-[10px] text-muted-foreground">{r.user_id.slice(0, 8)}</div>
                </TableCell>
                <TableCell>
                  {mode === "blocked" ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Blocked · {r.accepted_keys}/4 accepted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Up to date
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {mode === "completed" && r.accepted_at ? (
                    <>
                      {format(new Date(r.accepted_at), "PP")}
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.accepted_at), { addSuffix: true })}
                      </div>
                    </>
                  ) : r.last_prior_at ? (
                    <>
                      {format(new Date(r.last_prior_at), "PP")}
                      <div className="text-[11px] text-muted-foreground">v{r.last_prior_version}</div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Never accepted</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {mode === "blocked"
                    ? r.missing_keys.length > 0
                      ? <>Missing: <span className="font-mono">{r.missing_keys.join(", ")}</span></>
                      : `Awaiting v${activeVersion}`
                    : `v${activeVersion}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            {total === 0
              ? "0 results"
              : `Showing ${((page - 1) * (rows.length || 1)) + 1}–${Math.min(page * rows.length || 0, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2"
              disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>
              <ChevronLeft className="h-3 w-3" /> Prev
            </Button>
            <span className="px-2">Page {page} of {pageCount}</span>
            <Button variant="ghost" size="sm" className="h-7 px-2"
              disabled={page >= pageCount || loading} onClick={() => onPage(page + 1)}>
              Next <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
