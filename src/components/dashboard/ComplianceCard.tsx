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

export function ComplianceCard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { config, loading: cfgLoading } = usePolicyConfig();
  const [acks, setAcks] = useState<AckRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("policy_acknowledgements")
      .select("policy_key, policy_version, accepted_at")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false })
      .then(({ data }) => { if (active) setAcks((data as AckRow[]) ?? []); });
    return () => { active = false; };
  }, [user?.id]);

  // For each policy, find the latest ack for the active version (current),
  // otherwise the most recent prior ack (stale).
  const rows = POLICIES.map(p => {
    const all = (acks ?? []).filter(a => a.policy_key === p.key);
    const current = all.find(a => a.policy_version === config.policy_version);
    const latest = all[0];
    return {
      ...p,
      current,
      latest,
      status: current ? "current" : latest ? "stale" : "missing",
    } as const;
  });

  const ready = !cfgLoading && acks !== null;
  const allCurrent = ready && rows.every(r => r.status === "current");
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

      <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
        {rows.map(r => {
          const accepted = r.current ?? r.latest;
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
                </div>
                <div className="mt-0.5 pl-6 text-xs text-muted-foreground">
                  {r.status === "missing" && t.compliance.notAccepted}
                  {r.status === "stale" && accepted && (
                    <>
                      {t.compliance.acceptedOn} {format(new Date(accepted.accepted_at), "PP")}
                      {" · "}
                      <span className="text-amber-700">
                        {t.compliance.outdatedVersion} v{accepted.policy_version}
                      </span>
                    </>
                  )}
                  {r.status === "current" && accepted && (
                    <>
                      {t.compliance.acceptedOn} {format(new Date(accepted.accepted_at), "PP")}
                      {" · v"}{accepted.policy_version}
                    </>
                  )}
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
