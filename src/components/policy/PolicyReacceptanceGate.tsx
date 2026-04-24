import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink, ShieldCheck } from "lucide-react";
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

/**
 * Shown to authenticated, onboarded users when the active policy_version
 * differs from what they've previously acknowledged. Blocks the app until
 * the user re-accepts all four policies (or signs out).
 */
export function PolicyReacceptanceGate() {
  const { t } = useI18n();
  const { user, onboardingCompleted, signOut, loading: authLoading } = useAuth();
  const { config, loading: cfgLoading } = usePolicyConfig();

  const [needsReaccept, setNeedsReaccept] = useState(false);
  const [checking, setChecking] = useState(false);
  const [accepted, setAccepted] = useState<Record<PolicyKey, boolean>>({
    tos: false, privacy: false, aup: false, anti_solicitation: false,
  });
  const [busy, setBusy] = useState(false);

  // Re-check whenever the active user, version or onboarding state changes.
  useEffect(() => {
    let active = true;
    async function check() {
      if (authLoading || cfgLoading) return;
      // Only gate after onboarding is done — Onboarding itself records ack.
      if (!user || onboardingCompleted !== true) {
        if (active) setNeedsReaccept(false);
        return;
      }
      setChecking(true);
      const { data, error } = await supabase
        .from("policy_acknowledgements")
        .select("policy_key")
        .eq("user_id", user.id)
        .eq("policy_version", config.policy_version);

      if (!active) return;
      setChecking(false);

      if (error) {
        // Fail-open: don't lock users out on a transient read error.
        setNeedsReaccept(false);
        return;
      }
      const haveKeys = new Set((data ?? []).map(r => r.policy_key));
      const missing = POLICIES.some(p => !haveKeys.has(p.key));
      setNeedsReaccept(missing);
      if (missing) {
        setAccepted({ tos: false, privacy: false, aup: false, anti_solicitation: false });
      }
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

  if (!needsReaccept || checking) return null;

  return (
    <Dialog open={needsReaccept}>
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
