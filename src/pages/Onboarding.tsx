import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { Heart, ExternalLink } from "lucide-react";
import { usePolicyConfig, PolicyKey } from "@/lib/policyConfig";

const schema = z.object({
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(500).optional(),
});

const POLICIES: { key: PolicyKey; labelKey: "acceptTos" | "acceptPrivacy" | "acceptAup" | "acceptAnti" }[] = [
  { key: "tos", labelKey: "acceptTos" },
  { key: "privacy", labelKey: "acceptPrivacy" },
  { key: "aup", labelKey: "acceptAup" },
  { key: "anti_solicitation", labelKey: "acceptAnti" },
];

export default function Onboarding() {
  const { t } = useI18n();
  const { user, refreshProfile } = useAuth();
  const { config: policyConfig } = usePolicyConfig();
  const nav = useNavigate();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [accepted, setAccepted] = useState<Record<PolicyKey, boolean>>({
    tos: false, privacy: false, aup: false, anti_solicitation: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!user) nav("/auth", { replace: true }); }, [user, nav]);

  const allAccepted = POLICIES.every(p => accepted[p.key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ country, city, bio });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Check your details");
    if (!allAccepted) return toast.error(t.onboarding.mustAcceptAll);
    if (!user) return;

    setBusy(true);

    const ackRows = POLICIES.map(p => ({
      user_id: user.id,
      policy_key: p.key,
      policy_version: policyConfig.policy_version,
    }));
    const { error: ackError } = await supabase
      .from("policy_acknowledgements")
      .upsert(ackRows, { onConflict: "user_id,policy_key,policy_version", ignoreDuplicates: true });
    if (ackError) {
      setBusy(false);
      return toast.error(ackError.message);
    }

    const { error } = await supabase.from("profiles").update({
      country, city, bio: bio || null,
      onboarding_completed: true,
      community_rules_accepted_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    await refreshProfile();
    setBusy(false);
    toast.success(t.profile.saved);
    nav("/dashboard");
  }

  return (
    <div className="min-h-screen gradient-soft">
      <div className="container max-w-xl py-12">
        <div className="mb-8 flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" /> {t.brand.name}
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-semibold text-burgundy">{t.onboarding.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.onboarding.sub}</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.onboarding.country}</Label>
                <Input value={country} onChange={e => setCountry(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t.onboarding.city}</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.onboarding.bio}</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} maxLength={500} placeholder={t.onboarding.bioPlaceholder} />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <h2 className="font-display text-base font-semibold text-burgundy">{t.onboarding.policiesTitle}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t.onboarding.policiesSub}</p>
              <ul className="mt-4 space-y-3">
                {POLICIES.map(p => (
                  <li key={p.key} className="flex items-start gap-3">
                    <Checkbox
                      id={`policy-${p.key}`}
                      checked={accepted[p.key]}
                      onCheckedChange={(v) => setAccepted(prev => ({ ...prev, [p.key]: v === true }))}
                      className="mt-0.5"
                    />
                    <div className="flex-1 text-sm leading-snug">
                      <Label htmlFor={`policy-${p.key}`} className="cursor-pointer font-normal">
                        {t.onboarding[p.labelKey]}
                      </Label>
                      <Link
                        to={policyConfig.urls[p.key]}
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
            </div>

            <Button type="submit" variant="romance" size="lg" className="w-full" disabled={busy || !allAccepted}>
              {busy ? t.common.loading : t.onboarding.finish}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
