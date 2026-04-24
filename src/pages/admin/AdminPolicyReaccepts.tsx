import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronDown, ChevronRight, RefreshCw, Search, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type PerKeyStatus = "newly_acknowledged" | "already_existed";
type ReacceptMeta = {
  policy_version?: string;
  accepted_keys?: string[];
  newly_acknowledged?: string[];
  already_acknowledged?: string[];
  per_key?: Record<string, PerKeyStatus>;
  prior_versions?: Record<string, string | null>;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  subject_id: string | null;
  created_at: string;
  metadata: ReacceptMeta | null;
};

type ProfileRow = { id: string; display_name: string | null };

const POLICY_KEYS = ["tos", "privacy", "aup", "anti_solicitation"] as const;
const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: PerKeyStatus | undefined }) {
  if (status === "newly_acknowledged") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-mono"
      >
        newly
      </Badge>
    );
  }
  if (status === "already_existed") {
    return (
      <Badge
        variant="outline"
        className="border-border text-muted-foreground text-[10px] font-mono"
      >
        already
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-dashed text-[10px] text-muted-foreground">
      —
    </Badge>
  );
}

export default function AdminPolicyReaccepts() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [versionFilter, setVersionFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE; // fetch one extra to detect "has more"
    const { data, error: err } = await supabase
      .from("audit_events")
      .select("id, actor_id, subject_id, created_at, metadata")
      .eq("category", "policy")
      .eq("action", "policy_reaccepted")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (err) {
      setError(err.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const all = (data ?? []) as AuditRow[];
    setHasMore(all.length > PAGE_SIZE);
    const pageRows = all.slice(0, PAGE_SIZE);
    setRows(pageRows);

    // Hydrate display names for the subjects on this page.
    const subjectIds = Array.from(
      new Set(pageRows.map(r => r.subject_id).filter(Boolean) as string[]),
    );
    if (subjectIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", subjectIds);
      const map: Record<string, ProfileRow> = {};
      (profs ?? []).forEach(p => { map[p.id] = p as ProfileRow; });
      setProfiles(map);
    } else {
      setProfiles({});
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const versions = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach(r => {
      const v = r.metadata?.policy_version;
      if (v) set.add(v);
    });
    return Array.from(set).sort().reverse();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter(r => {
      if (versionFilter !== "all" && r.metadata?.policy_version !== versionFilter) {
        return false;
      }
      if (!q) return true;
      const name = (r.subject_id && profiles[r.subject_id]?.display_name) || "";
      return (
        name.toLowerCase().includes(q) ||
        (r.subject_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, versionFilter, profiles]);

  const totals = useMemo(() => {
    let newlyTotal = 0;
    let alreadyTotal = 0;
    filtered.forEach(r => {
      newlyTotal += r.metadata?.newly_acknowledged?.length ?? 0;
      alreadyTotal += r.metadata?.already_acknowledged?.length ?? 0;
    });
    return { newlyTotal, alreadyTotal, events: filtered.length };
  }, [filtered]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Policy re-accept events"
        sub="Audit trail of every policy_reaccepted event with per-key newly vs already-existed status."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Events on page</div>
            <div className="mt-1 font-display text-2xl font-semibold">{totals.events}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-700">Newly acknowledged keys</div>
            <div className="mt-1 font-display text-2xl font-semibold text-emerald-700">{totals.newlyTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Already-existed keys</div>
            <div className="mt-1 font-display text-2xl font-semibold">{totals.alreadyTotal}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or user id"
            className="w-[280px] pl-8"
          />
        </div>
        <Select value={versionFilter} onValueChange={setVersionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All versions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All versions</SelectItem>
            {versions.map(v => (
              <SelectItem key={v} value={v}>v{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Failed to load: {error}</span>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Version</TableHead>
              {POLICY_KEYS.map(k => (
                <TableHead key={k} className="font-mono text-[11px]">{k}</TableHead>
              ))}
              <TableHead className="text-right">Newly / Already</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (rows === null || rows.length === 0) && (
              <TableRow>
                <TableCell colSpan={4 + POLICY_KEYS.length + 1} className="text-center text-sm text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4 + POLICY_KEYS.length + 1} className="text-center text-sm text-muted-foreground py-8">
                  No re-accept events match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(row => {
              const meta = row.metadata ?? {};
              const perKey = meta.per_key ?? {};
              const newly = meta.newly_acknowledged?.length ?? 0;
              const already = meta.already_acknowledged?.length ?? 0;
              const isOpen = !!expanded[row.id];
              const subject = row.subject_id ? profiles[row.subject_id] : null;
              return (
                <Fragment key={row.id}>
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="align-top">
                      <button
                        type="button"
                        aria-label={isOpen ? "Collapse details" : "Expand details"}
                        onClick={() => setExpanded(s => ({ ...s, [row.id]: !s[row.id] }))}
                        className="rounded p-1 text-muted-foreground hover:bg-muted"
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm">{format(new Date(row.created_at), "PP p")}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {row.subject_id ? (
                        <Link
                          to={`/admin/users/${row.subject_id}`}
                          className="text-sm font-medium text-burgundy hover:underline"
                        >
                          {subject?.display_name || "Unnamed"}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {row.subject_id ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {meta.policy_version ? (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          v{meta.policy_version}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {POLICY_KEYS.map(k => (
                      <TableCell key={k} className="align-top">
                        <StatusBadge status={perKey[k]} />
                      </TableCell>
                    ))}
                    <TableCell className="align-top text-right">
                      <span className="text-emerald-700">{newly}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span>{already}</span>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={`${row.id}-details`} className="bg-muted/20">
                      <TableCell colSpan={4 + POLICY_KEYS.length + 1}>
                        <div className="grid gap-3 px-2 py-2 text-xs sm:grid-cols-2">
                          <div>
                            <div className="mb-1 font-semibold uppercase tracking-wider text-emerald-700">
                              Newly acknowledged
                            </div>
                            {(meta.newly_acknowledged ?? []).length === 0 ? (
                              <span className="text-muted-foreground">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {meta.newly_acknowledged!.map(k => (
                                  <Badge
                                    key={k}
                                    variant="outline"
                                    className="border-emerald-300 bg-emerald-50 text-emerald-800 font-mono text-[10px]"
                                  >
                                    {k}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
                              Already up to date
                            </div>
                            {(meta.already_acknowledged ?? []).length === 0 ? (
                              <span className="text-muted-foreground">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {meta.already_acknowledged!.map(k => (
                                  <Badge
                                    key={k}
                                    variant="outline"
                                    className="border-border text-muted-foreground font-mono text-[10px]"
                                  >
                                    {k}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
                              Prior versions per key
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {POLICY_KEYS.map(k => {
                                const prior = meta.prior_versions?.[k] ?? null;
                                return (
                                  <Badge
                                    key={k}
                                    variant="outline"
                                    className="font-mono text-[10px]"
                                  >
                                    {k}: {prior ? `v${prior}` : "never"}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Showing up to {PAGE_SIZE} most-recent events per page.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span>Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
