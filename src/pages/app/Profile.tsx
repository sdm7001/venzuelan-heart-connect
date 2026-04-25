import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [p, setP] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setP(data ?? {}));
  }, [user]);

  function up<K extends string>(k: K, v: unknown) { setP({ ...p, [k]: v }); }

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: p.display_name, country: p.country, city: p.city,
      bio: p.bio, relationship_intention: p.relationship_intention,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t.profile.saved);
  }

  return (
    <AppLayout>
      <PageHeader title={t.profile.title} />
      <div className="grid gap-6 md:grid-cols-2">
        <Field label={t.auth.displayName}><Input value={p.display_name ?? ""} onChange={e => up("display_name", e.target.value)} /></Field>
        <Field label={t.onboarding.country}><Input value={p.country ?? ""} onChange={e => up("country", e.target.value)} /></Field>
        <Field label={t.onboarding.city}><Input value={p.city ?? ""} onChange={e => up("city", e.target.value)} /></Field>
        <Field label={t.auth.intentionLabel}>
          <Select value={p.relationship_intention ?? ""} onValueChange={v => up("relationship_intention", v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="marriage">{t.auth.intent.marriage}</SelectItem>
              <SelectItem value="serious_relationship">{t.auth.intent.serious}</SelectItem>
              <SelectItem value="travel_and_meet">{t.auth.intent.travel}</SelectItem>
              <SelectItem value="friendship_first">{t.auth.intent.friendship}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label={t.onboarding.bio}>
            <Textarea rows={4} value={p.bio ?? ""} onChange={e => up("bio", e.target.value)} maxLength={500} />
          </Field>
        </div>
      </div>
      <div className="mt-8">
        <Button variant="romance" size="lg" disabled={busy} onClick={save}>{busy ? t.common.loading : t.profile.save}</Button>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
