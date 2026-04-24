import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

const joinSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(60),
  accountType: z.enum(["female_user", "male_user"]),
  intention: z.enum(["marriage", "serious_relationship", "travel_and_meet", "friendship_first"]),
  ageConfirmed: z.literal(true),
  rulesAccepted: z.literal(true),
});

export default function Auth() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "join" ? "join" : "signin";
  const [mode, setMode] = useState<"signin" | "join">(initialMode);

  useEffect(() => { if (user) nav("/dashboard", { replace: true }); }, [user, nav]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<"female_user" | "male_user">("female_user");
  const [intention, setIntention] = useState<"marriage"|"serious_relationship"|"travel_and_meet"|"friendship_first">("serious_relationship");
  const [ageOk, setAgeOk] = useState(false);
  const [rulesOk, setRulesOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t.auth.success);
    nav("/dashboard");
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = joinSchema.safeParse({
      email, password, displayName, accountType, intention,
      ageConfirmed: ageOk, rulesAccepted: rulesOk,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return toast.error(first?.message ?? "Please check your details");
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          display_name: displayName,
          account_type: accountType,
          preferred_language: lang,
          age_confirmed: true,
          relationship_intention: intention,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t.auth.success);
    nav("/onboarding");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden gradient-romance md:block">
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Heart className="h-5 w-5" fill="currentColor" /> {t.brand.name}
          </Link>
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight text-balance">{t.brand.tagline}</h2>
            <p className="mt-3 max-w-md text-primary-foreground/85">{t.hero.sub}</p>
          </div>
          <div className="text-xs text-primary-foreground/80">{t.footer.copyright}</div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <Link to="/" className="md:hidden flex items-center gap-2 font-display font-semibold text-burgundy">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" /> {t.brand.name}
          </Link>
          <div className="ml-auto"><LanguageToggle /></div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-semibold text-burgundy">
              {mode === "join" ? t.auth.joinTitle : t.auth.signinTitle}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "join" ? t.auth.joinSub : t.auth.signinSub}
            </p>

            <form onSubmit={mode === "join" ? handleJoin : handleSignIn} className="mt-7 space-y-4">
              {mode === "join" && (
                <div className="space-y-1.5">
                  <Label>{t.auth.displayName}</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} required maxLength={60} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{t.auth.email}</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t.auth.password}</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              </div>

              {mode === "join" && (
                <>
                  <div className="space-y-2">
                    <Label>{t.auth.iAm}</Label>
                    <RadioGroup value={accountType} onValueChange={(v: any) => setAccountType(v)} className="grid grid-cols-2 gap-2">
                      <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${accountType==="female_user" ? "border-primary bg-primary-soft/40" : "border-border"}`}>
                        <RadioGroupItem value="female_user" /> {t.auth.woman}
                      </label>
                      <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${accountType==="male_user" ? "border-primary bg-primary-soft/40" : "border-border"}`}>
                        <RadioGroupItem value="male_user" /> {t.auth.man}
                      </label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t.auth.intentionLabel}</Label>
                    <Select value={intention} onValueChange={(v: any) => setIntention(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marriage">{t.auth.intent.marriage}</SelectItem>
                        <SelectItem value="serious_relationship">{t.auth.intent.serious}</SelectItem>
                        <SelectItem value="travel_and_meet">{t.auth.intent.travel}</SelectItem>
                        <SelectItem value="friendship_first">{t.auth.intent.friendship}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <Checkbox checked={ageOk} onCheckedChange={(v) => setAgeOk(!!v)} className="mt-0.5" />
                    <span>{t.auth.ageConfirm}</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={rulesOk} onCheckedChange={(v) => setRulesOk(!!v)} className="mt-0.5" />
                    <span>{t.auth.rules}</span>
                  </label>
                </>
              )}

              <Button type="submit" disabled={busy} variant="romance" className="w-full" size="lg">
                {busy ? t.common.loading : mode === "join" ? t.auth.submitJoin : t.auth.submitSignin}
              </Button>
            </form>

            <button onClick={() => setMode(mode === "join" ? "signin" : "join")}
              className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground">
              {mode === "join" ? t.auth.switchToSignin : t.auth.switchToJoin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
