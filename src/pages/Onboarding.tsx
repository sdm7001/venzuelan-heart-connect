import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { Heart } from "lucide-react";

const schema = z.object({
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(500).optional(),
});

export default function Onboarding() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!user) nav("/auth", { replace: true }); }, [user, nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ country, city, bio });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Check your details");
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      country, city, bio: bio || null,
      onboarding_completed: true,
      community_rules_accepted_at: new Date().toISOString(),
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <Button type="submit" variant="romance" size="lg" className="w-full" disabled={busy}>
              {busy ? t.common.loading : t.onboarding.finish}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
