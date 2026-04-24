import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ShieldCheck, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { usePolicyConfig, PolicyKey } from "@/lib/policyConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const POLICIES: { key: PolicyKey; labelKey: "tos" | "privacy" | "aup" | "antiSolicit" }[] = [
  { key: "tos", labelKey: "tos" },
  { key: "privacy", labelKey: "privacy" },
  { key: "aup", labelKey: "aup" },
  { key: "anti_solicitation", labelKey: "antiSolicit" },
];

type AckRow = { policy_key: string; policy_version: string; accepted_at: string };
type ReacceptEvent = {
  created_at: string;
  metadata: {
    policy_version?: string;
    newly_acknowledged?: string[];
    already_acknowledged?: string[];
  } | null;
};

export function ComplianceCard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { config, loading: cfgLoading } = usePolicyConfig();
  const [acks, setAcks] = useState<AckRow[] | null>(null);
  const [lastReaccept, setLastReaccept] = useState<ReacceptEvent | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("policy_acknowledgements")
      .select("policy_key, policy_version, accepted_at")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false })
      .then(({ data }) => { if (active) setAcks((data as AckRow[]) ?? []); });
    supabase
      .from("audit_events")
      .select("created_at, metadata")
      .eq("subject_id", user.id)
      .eq("category", "policy")
      .eq("action", "policy_reaccepted")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!active) return;
        const row = (data ?? [])[0] as ReacceptEvent | undefined;
        setLastReaccept(row ?? null);
      });
    return () => { active = false; };
  }, [user?.id]);

  // For each policy, find the latest ack for the active version (current),
  // otherwise the most recent prior ack (stale).
  const rows = POLICIES.map(p => {
    const all = (acks ?? []).filter(a => a.policy_key === p.key);
    const current = all.find(a => a.policy_version === config.policy_version);
    const latest = all[0]; // already sorted desc by accepted_at
    return {
      ...p,
      current,
      latest,
      status: current ? "current" : latest ? "stale" : "missing",
    } as const;
  });

  const ready = !cfgLoading && acks !== null;
  const missingRows = rows.filter(r => r.status !== "current");
  const allCurrent = ready && missingRows.length === 0;
  const anyMissing = ready && rows.some(r => r.status === "missing");

  const headlineIcon = allCurrent
    ? <ShieldCheck className="h-5 w-5 text-emerald-600" />
    : <AlertTriangle className="h-5 w-5 text-amber-600" />;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{headlineIcon}</span>
          <span className="text-xs font-medium uppercase tracking-wider">
            {t.compliance.title}
          </span>
        </div>
        <Badge
          variant={allCurrent ? "secondary" : "destructive"}
          className={allCurrent ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : undefined}
        >
          {!ready
            ? t.common.loading
            : allCurrent
              ? t.compliance.upToDate
              : anyMissing
                ? t.compliance.actionRequired
                : t.compliance.updatesRequired}
        </Badge>
      </div>

      <div className="mt-2 font-display text-lg font-semibold text-burgundy">
        {ready
          ? allCurrent
            ? t.compliance.headlineOk
            : t.compliance.headlineAction
          : "—"}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t.compliance.activeVersion}: <span className="font-mono">{config.policy_version}</span>
      </p>

      {ready && missingRows.length > 0 && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="leading-snug">
            {t.compliance.missingSummary.replace(
              "{keys}",
              missingRows.map(r => t.legal[r.labelKey]).join(" · ")
            )}
          </div>
        </div>
      )}

      <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
        {rows.map(r => {
          const accepted = r.current ?? r.latest;
          const tsLabel = accepted
            ? `${t.compliance.lastAcknowledged}: ${format(new Date(accepted.accepted_at), "PP p")} · v${accepted.policy_version}`
            : t.compliance.neverAcknowledged;
          return (
            <li key={r.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {r.status === "current" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span className="truncate">{t.legal[r.labelKey]}</span>
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                    {r.key}
                  </span>
                  {r.status === "stale" && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">
                      {t.compliance.outdatedVersion} v{accepted!.policy_version}
                    </Badge>
                  )}
                  {r.status === "missing" && (
                    <Badge variant="outline" className="border-red-300 text-red-700 text-[10px]">
                      {t.compliance.actionRequired}
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 pl-6 text-xs text-muted-foreground">
                  {tsLabel}
                </div>
              </div>
              <Button asChild size="sm" variant="ghost" className="shrink-0">
                <Link to={config.urls[r.key]} target="_blank" rel="noreferrer">
                  {t.compliance.review} <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>

      {!allCurrent && ready && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t.compliance.reacceptHint}
        </p>
      )}
    </div>
  );
}

export default ComplianceCard;
