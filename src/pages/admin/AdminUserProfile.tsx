import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, CheckCircle2, AlertTriangle, History, Mail, ShieldCheck } from "lucide-react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fetchPolicyConfig, PolicyConfig, PolicyKey, DEFAULT_POLICY_CONFIG } from "@/lib/policyConfig";

type Profile = {
  id: string; display_name: string | null; account_status: string;
  country: string | null; city: string | null; gender: string | null;
  created_at: string; community_rules_accepted_at: string | null;
};
type Ack = { id: string; policy_key: string; policy_version: string; accepted_at: string };
type AuditRow = {
  id: string; actor_id: string | null; subject_id: string | null;
  action: string; metadata: any; created_at: string; category: string;
};
type Reminder = {
  id: string; policy_version: string; missing_keys: string[];
  channel: string; created_at: string; dismissed_at: string | null;
};

const POLICY_KEYS: PolicyKey[] = ["tos", "privacy", "aup", "anti_solicitation"];
const POLICY_LABELS: Record<PolicyKey, string> = {
  tos: "Terms of Service",
  privacy: "Privacy Policy",
  aup: "Acceptable Use Policy",
  anti_solicitation: "Anti-solicitation",
};

export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [config, setConfig] = useState<PolicyConfig>(DEFAULT_POLICY_CONFIG);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [acks, setAcks] = useState<Ack[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      setLoading(true);
      const cfg = await fetchPolicyConfig();
      const [{ data: p }, { data: a }, { data: au }, { data: r }] = await Promise.all([
        supabase.from("profiles")
          .select("id, display_name, account_status, country, city, gender, created_at, community_rules_accepted_at")
          .eq("id", userId).maybeSingle(),
        supabase.from("policy_acknowledgements")
          .select("id, policy_key, policy_version, accepted_at")
          .eq("user_id", userId)
          .order("accepted_at", { ascending: false })
          .limit(500),
        supabase.from("audit_events")
          .select("id, actor_id, subject_id, action, metadata, created_at, category")
          .or(`subject_id.eq.${userId},actor_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("policy_reminders")
          .select("id, policy_version, missing_keys, channel, created_at, dismissed_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (!active) return;
      setConfig(cfg);
      setProfile((p as Profile) ?? null);
      setNotFound(!p);
      setAcks((a as Ack[]) ?? []);
      setAudit((au as AuditRow[]) ?? []);
      setReminders((r as Reminder[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [userId]);

  // Compute per-policy acceptance state for the *active* version, plus the
  // last time each policy was acknowledged at any version (the headline data
  // an admin needs to triage compliance issues).
  const compliance = useMemo(() => {
    const currentByKey = new Map<PolicyKey, Ack>();
    const lastByKey = new Map<PolicyKey, Ack>();
    for (const a of acks) {
      const key = a.policy_key as PolicyKey;
      if (!POLICY_KEYS.includes(key)) continue;
      if (!lastByKey.has(key)) lastByKey.set(key, a); // acks already desc by date
      if (a.policy_version === config.policy_version && !currentByKey.has(key)) {
        currentByKey.set(key, a);
      }
    }
    const missing = POLICY_KEYS.filter(k => !currentByKey.has(k));
    return {
      currentByKey, lastByKey, missing,
      hasCurrent: missing.length === 0,
      acceptedKeys: currentByKey.size,
    };
  }, [acks, config.policy_version]);

  if (!userId) return null;

  return (
    <AdminLayout>
      <AdminPageHeader
        title={profile?.display_name ?? "Member profile"}
        sub={`Compliance overview for v${config.policy_version}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/policy-acceptance">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to audit
            </Link>
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : notFound ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Member not found, or you don't have access to this record.
        </CardContent></Card>
      ) : profile ? (
        <div className="space-y-6">
          {/* Identity card */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <div className="font-display text-lg">{profile.display_name ?? "—"}</div>
                <div className="font-mono text-xs text-muted-foreground">{profile.id}</div>
                <div className="text-xs text-muted-foreground">
                  Joined {format(new Date(profile.created_at), "PP")}
                  {profile.country ? ` · ${profile.city ? profile.city + ", " : ""}${profile.country}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{profile.account_status}</Badge>
                {compliance.hasCurrent ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> v{config.policy_version} accepted
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Blocked · {compliance.acceptedKeys}/{POLICY_KEYS.length} accepted
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Per-policy compliance */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Policy compliance for v{config.policy_version}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accepted (current)</TableHead>
                    <TableHead>Last accepted (any version)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {POLICY_KEYS.map(k => {
                    const cur = compliance.currentByKey.get(k);
                    const last = compliance.lastByKey.get(k);
                    return (
                      <TableRow key={k}>
                        <TableCell>
                          <div className="font-medium">{POLICY_LABELS[k]}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{k}</div>
                        </TableCell>
                        <TableCell>
                          {cur ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Up to date</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300 text-amber-700">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {cur ? format(new Date(cur.accepted_at), "PPp") : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {last ? (
                            <>
                              {format(new Date(last.accepted_at), "PP")}
                              <div className="text-[11px] text-muted-foreground">
                                v{last.policy_version} · {formatDistanceToNow(new Date(last.accepted_at), { addSuffix: true })}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Never accepted</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Full ack history */}
          <Card>
            <CardHeader><CardTitle className="text-base">Acknowledgement history</CardTitle></CardHeader>
            <CardContent>
              {acks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No acknowledgements recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Policy</TableHead>
                      <TableHead>Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acks.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(a.accepted_at), "PPp")}
                        </TableCell>
                        <TableCell>{POLICY_LABELS[a.policy_key as PolicyKey] ?? a.policy_key}</TableCell>
                        <TableCell>
                          <Badge variant={a.policy_version === config.policy_version ? "default" : "secondary"}>
                            v{a.policy_version}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Reminders sent */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Re-acceptance reminders</CardTitle>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reminders have been sent to this member.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sent</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Missing at send</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Dismissed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "PPp")}
                        </TableCell>
                        <TableCell>v{r.policy_version}</TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {r.missing_keys?.length ? r.missing_keys.join(", ") : "—"}
                        </TableCell>
                        <TableCell><Badge variant="outline">{r.channel}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.dismissed_at ? formatDistanceToNow(new Date(r.dismissed_at), { addSuffix: true }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent audit events involving this user */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Recent audit events</CardTitle>
            </CardHeader>
            <CardContent>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit events recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audit.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(e.created_at), "PPp")}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">{e.action}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {e.metadata?.policy_version && <>v{e.metadata.policy_version} </>}
                          {e.metadata?.missing_keys?.length ? (
                            <span className="font-mono">{e.metadata.missing_keys.join(", ")}</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
