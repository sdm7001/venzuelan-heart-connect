import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { usePolicyConfig, PolicyKey } from "@/lib/policyConfig";
import { assertPolicyReacceptedMetadata } from "@/lib/policyAuditSchema";

const POLICIES: { key: PolicyKey; labelKey: "acceptTos" | "acceptPrivacy" | "acceptAup" | "acceptAnti"; shortKey: "tos" | "privacy" | "aup" | "antiSolicit" }[] = [
  { key: "tos", labelKey: "acceptTos", shortKey: "tos" },
  { key: "privacy", labelKey: "acceptPrivacy", shortKey: "privacy" },
  { key: "aup", labelKey: "acceptAup", shortKey: "aup" },
  { key: "anti_solicitation", labelKey: "acceptAnti", shortKey: "antiSolicit" },
];

type PriorAck = { policy_version: string; accepted_at: string };

/**
 * Shown to authenticated, onboarded users when the active policy_version
 * differs from what they've previously acknowledged. Blocks the app until
 * the user re-accepts all four policies (or signs out).
 */
export function PolicyReacceptanceGate() {
  const { t } = useI18n();
  const { user, onboardingCompleted, signOut, loading: authLoading } = useAuth();
  const { config, loading: cfgLoading } = usePolicyConfig();

  // `ready` flips true only after the first complete check resolves for the
  // current (user, version) pair. Until then we render nothing — the dialog
  // can never flash on initial mount or while auth/config are still loading.
  const [ready, setReady] = useState(false);
  const [needsReaccept, setNeedsReaccept] = useState(false);
  const [missingKeys, setMissingKeys] = useState<Set<PolicyKey>>(new Set());
  const [priorByKey, setPriorByKey] = useState<Partial<Record<PolicyKey, PriorAck>>>({});
  const [accepted, setAccepted] = useState<Record<PolicyKey, boolean>>({
    tos: false, privacy: false, aup: false, anti_solicitation: false,
  });
  const [busy, setBusy] = useState(false);

  // Re-check whenever the active user, version or onboarding state changes.
  useEffect(() => {
    let active = true;

    // Reset readiness whenever inputs change so we don't render stale state.
    setReady(false);

    async function check() {
      // Wait until auth + policy config have both resolved.
      if (authLoading || cfgLoading) return;

      // No user, or user hasn't onboarded yet → nothing to gate. Mark ready
      // so future state changes can flip needsReaccept without a flash.
      if (!user || onboardingCompleted !== true) {
        if (!active) return;
        setNeedsReaccept(false);
        setReady(true);
        return;
      }

      // Pull every prior acceptance for this user across all policies/versions
      // so we can tell each missing policy from a brand-new one and surface
      // the previously-accepted version to the user.
      const { data, error } = await supabase
        .from("policy_acknowledgements")
        .select("policy_key, policy_version, accepted_at")
        .eq("user_id", user.id)
        .order("accepted_at", { ascending: false });

      if (!active) return;

      if (error) {
        // Fail-open: never lock users out on a transient read error,
        // but still mark ready so the gate stays closed without flashing.
        setNeedsReaccept(false);
        setReady(true);
        return;
      }

      const rows = (data ?? []) as { policy_key: string; policy_version: string; accepted_at: string }[];
      const haveCurrent = new Set(
        rows.filter(r => r.policy_version === config.policy_version).map(r => r.policy_key)
      );
      const missing = new Set<PolicyKey>(
        POLICIES.map(p => p.key).filter(k => !haveCurrent.has(k))
      );

      // Most recent prior (non-current) ack per policy.
      const prior: Partial<Record<PolicyKey, PriorAck>> = {};
      for (const r of rows) {
        if (r.policy_version === config.policy_version) continue;
        const k = r.policy_key as PolicyKey;
        if (!prior[k]) prior[k] = { policy_version: r.policy_version, accepted_at: r.accepted_at };
      }

      if (missing.size > 0) {
        setAccepted({ tos: false, privacy: false, aup: false, anti_solicitation: false });
      }
      setMissingKeys(missing);
      setPriorByKey(prior);
      setNeedsReaccept(missing.size > 0);
      setReady(true);
    }

    check();
    return () => { active = false; };
  }, [user?.id, onboardingCompleted, config.policy_version, authLoading, cfgLoading]);

  // Only the policies actually missing for this user need a fresh checkbox.
  const missingPolicies = useMemo(
    () => POLICIES.filter(p => missingKeys.has(p.key)),
    [missingKeys]
  );
  const allAccepted = useMemo(
    () => missingPolicies.every(p => accepted[p.key]),
    [missingPolicies, accepted]
  );

  async function handleConfirm() {
    if (!user) return;
    if (!allAccepted) return toast.error(t.onboarding.mustAcceptAll);
    setBusy(true);

    // Pre-check which of the policies we're about to upsert already have a row
    // for the current policy_version. We need this BEFORE the upsert so the
    // audit trail can distinguish newly-acknowledged keys from idempotent
    // re-clicks (the upsert with ignoreDuplicates won't return that info).
    const keysToWrite = missingPolicies.map(p => p.key);
    const { data: existingRows } = await supabase
      .from("policy_acknowledgements")
      .select("policy_key")
      .eq("user_id", user.id)
      .eq("policy_version", config.policy_version)
      .in("policy_key", keysToWrite);

    const alreadyExisted = new Set((existingRows ?? []).map(r => r.policy_key as PolicyKey));
    const newlyAcknowledged = keysToWrite.filter(k => !alreadyExisted.has(k));
    const alreadyAcknowledged = keysToWrite.filter(k => alreadyExisted.has(k));

    const rows = missingPolicies.map(p => ({
      user_id: user.id,
      policy_key: p.key,
      policy_version: config.policy_version,
    }));
    const { error } = await supabase
      .from("policy_acknowledgements")
      .upsert(rows, { onConflict: "user_id,policy_key,policy_version", ignoreDuplicates: true });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }

    // Per-key status lets admins see exactly what changed during this flow.
    const per_key = keysToWrite.reduce<Record<string, "newly_acknowledged" | "already_existed">>(
      (acc, k) => {
        acc[k] = alreadyExisted.has(k) ? "already_existed" : "newly_acknowledged";
        return acc;
      },
      {}
    );

    // Build the metadata up-front so we can validate before writing. If the
    // shape ever drifts (new field, missing partition entry, etc.) we want a
    // dev-time failure here instead of a polluted audit trail.
    const metadata = {
      policy_version: config.policy_version,
      accepted_keys: keysToWrite,
      newly_acknowledged: newlyAcknowledged,
      already_acknowledged: alreadyAcknowledged,
      per_key,
      prior_versions: keysToWrite.reduce<Record<string, string | null>>((acc, k) => {
        acc[k] = priorByKey[k as PolicyKey]?.policy_version ?? null;
        return acc;
      }, {}),
    };

    try {
      assertPolicyReacceptedMetadata(metadata);
    } catch (e) {
      setBusy(false);
      // Surface to the user *and* to logs — this is a programmer error, not
      // user input, so we want it to be loud in development.
      console.error("[PolicyReacceptanceGate] metadata validation failed", e, metadata);
      return toast.error("Could not record acceptance — please refresh and try again.");
    }

    // Audit insert is best-effort with bounded exponential backoff. The user's
    // acceptance has already been persisted by the upsert above, so a failure
    // here must NOT roll back the gate or block the user — it only degrades
    // observability. We retry transient errors a few times, then surface a
    // safe "saved but logging failed" state and unblock the app.
    const auditPayload = {
      actor_id: user.id,
      subject_id: user.id,
      category: "policy",
      action: "policy_reaccepted",
      metadata: metadata as Record<string, unknown>,
    };
    const MAX_ATTEMPTS = 3;
    let auditErr: { message: string } | null = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { error } = await supabase.from("audit_events").insert(auditPayload as never);
      if (!error) { auditErr = null; break; }
      auditErr = error;
      if (attempt < MAX_ATTEMPTS) {
        // 200ms, 400ms backoff. Keep total wait well under a perceivable hang.
        await new Promise(r => setTimeout(r, 200 * attempt));
      }
    }

    setBusy(false);
    setNeedsReaccept(false);
    if (auditErr) {
      console.error(
        "[PolicyReacceptanceGate] audit insert failed after retries",
        auditErr,
        auditPayload,
      );
      toast.error(t.policyReacceptErrors.auditFailedTitle, {
        description: t.policyReacceptErrors.auditFailedBody,
      });
    } else {
      toast.success(t.policyReaccept.confirmed);
    }
  }

  // Render nothing until the first check has fully resolved — eliminates
  // any chance of a flash on initial auth/config fetches.
  if (!ready || !needsReaccept) return null;

  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg"
        // Block close on overlay/escape — must explicitly accept or sign out.
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-burgundy">
            {t.policyReaccept.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t.policyReaccept.sub.replace("{version}", config.policy_version)}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">
              {missingPolicies.length === POLICIES.length
                ? t.policyReaccept.allMissing
                : t.policyReaccept.someMissing
                    .replace("{count}", String(missingPolicies.length))
                    .replace("{total}", String(POLICIES.length))}
            </div>
            <div className="mt-0.5 text-xs text-amber-800/90">
              {missingPolicies.map(p => t.legal[p.shortKey]).join(" · ")}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-background p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.policyReaccept.previewTitle}
          </div>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {POLICIES.map(p => (
              <li key={`preview-${p.key}`}>
                <Link
                  to={config.urls[p.key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t.legal[p.shortKey]} — ${t.policyReaccept.openInNewTab}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                  <span className="truncate">{t.legal[p.shortKey]}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-3 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          {POLICIES.map(p => {
            const isMissing = missingKeys.has(p.key);
            const prior = priorByKey[p.key];
            return (
              <li key={p.key} className="flex items-start gap-3">
                {isMissing ? (
                  <Checkbox
                    id={`reaccept-${p.key}`}
                    checked={accepted[p.key]}
                    onCheckedChange={(v) => setAccepted(prev => ({ ...prev, [p.key]: v === true }))}
                    className="mt-0.5"
                  />
                ) : (
                  <Checkbox checked disabled className="mt-0.5 opacity-70" />
                )}
                <div className="flex-1 text-sm leading-snug">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label
                      htmlFor={isMissing ? `reaccept-${p.key}` : undefined}
                      className={isMissing ? "cursor-pointer font-normal" : "font-normal text-muted-foreground"}
                    >
                      {t.onboarding[p.labelKey]}
                    </Label>
                    {isMissing ? (
                      <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">
                        {prior
                          ? t.policyReaccept.needsUpdate.replace("{version}", prior.policy_version)
                          : t.policyReaccept.neverAccepted}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                        {t.policyReaccept.upToDate}
                      </Badge>
                    )}
                  </div>
                  <Link
                    to={config.urls[p.key]}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t.onboarding.readPolicy} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => signOut()} disabled={busy}>
            {t.policyReaccept.signOut}
          </Button>
          <Button variant="romance" onClick={handleConfirm} disabled={!allAccepted || busy}>
            {busy ? t.common.loading : t.policyReaccept.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PolicyReacceptanceGate;
