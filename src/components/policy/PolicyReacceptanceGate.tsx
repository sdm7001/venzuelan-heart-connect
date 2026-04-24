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

const POLICIES: { key: PolicyKey; labelKey: "acceptTos" | "acceptPrivacy" | "acceptAup" | "acceptAnti" }[] = [
  { key: "tos", labelKey: "acceptTos" },
  { key: "privacy", labelKey: "acceptPrivacy" },
  { key: "aup", labelKey: "acceptAup" },
  { key: "anti_solicitation", labelKey: "acceptAnti" },
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

  const allAccepted = useMemo(() => POLICIES.every(p => accepted[p.key]), [accepted]);

  async function handleConfirm() {
    if (!user) return;
    if (!allAccepted) return toast.error(t.onboarding.mustAcceptAll);
    setBusy(true);

    const rows = POLICIES.map(p => ({
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

    await supabase.from("audit_events").insert({
      actor_id: user.id,
      subject_id: user.id,
      category: "policy",
      action: "policy_reaccepted",
      metadata: { policy_version: config.policy_version } as any,
    });

    setBusy(false);
    setNeedsReaccept(false);
    toast.success(t.policyReaccept.confirmed);
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

        <ul className="mt-2 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          {POLICIES.map(p => (
            <li key={p.key} className="flex items-start gap-3">
              <Checkbox
                id={`reaccept-${p.key}`}
                checked={accepted[p.key]}
                onCheckedChange={(v) => setAccepted(prev => ({ ...prev, [p.key]: v === true }))}
                className="mt-0.5"
              />
              <div className="flex-1 text-sm leading-snug">
                <Label htmlFor={`reaccept-${p.key}`} className="cursor-pointer font-normal">
                  {t.onboarding[p.labelKey]}
                </Label>
                <Link
                  to={config.urls[p.key]}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {t.onboarding.readPolicy} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </li>
          ))}
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
