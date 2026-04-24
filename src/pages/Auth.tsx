import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { cn } from "@/lib/utils";

const joinSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(60),
  accountType: z.enum(["female_user", "male_user"]),
  intention: z.enum(["marriage", "serious_relationship", "travel_and_meet", "friendship_first"]),
  ageConfirmed: z.literal(true),
  rulesAccepted: z.literal(true),
});

type FieldErrors = Partial<Record<
  "email" | "password" | "displayName" | "accountType" | "intention" | "ageConfirmed" | "rulesAccepted",
  string
>>;

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
  const [errors, setErrors] = useState<FieldErrors>({});

  const errMsg = useMemo(() => ({
    emailInvalid: lang === "es" ? "Introduce un correo válido." : "Enter a valid email.",
    passwordShort: lang === "es" ? "La contraseña debe tener al menos 8 caracteres." : "Password must be at least 8 characters.",
    displayNameShort: lang === "es" ? "El nombre debe tener al menos 2 caracteres." : "Name must be at least 2 characters.",
    ageRequired: lang === "es" ? "Debes confirmar tu edad." : "You must confirm your age.",
    rulesRequired: lang === "es" ? "Debes aceptar las reglas." : "You must accept the rules.",
  }), [lang]);

  function clearError(field: keyof FieldErrors) {
    if (!errors[field]) return;
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!z.string().email().safeParse(email).success) next.email = errMsg.emailInvalid;
    if (password.length < 1) next.password = errMsg.passwordShort;
    setErrors(next);
    if (Object.keys(next).length) return;

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
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FieldErrors;
        if (next[k]) continue;
        if (k === "email") next.email = errMsg.emailInvalid;
        else if (k === "password") next.password = errMsg.passwordShort;
        else if (k === "displayName") next.displayName = errMsg.displayNameShort;
        else if (k === "ageConfirmed") next.ageConfirmed = errMsg.ageRequired;
        else if (k === "rulesAccepted") next.rulesAccepted = errMsg.rulesRequired;
        else next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
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

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    setBusy(false);
    nav("/dashboard");
  }

  const fieldError = (id: string, msg?: string) =>
    msg ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="break-words text-xs leading-snug text-destructive"
      >
        {msg}
      </p>
    ) : null;

  return (
    <div className="grid min-h-[100dvh] md:grid-cols-2">
      {/* Brand panel — desktop only */}
      <div className="relative hidden gradient-romance md:block">
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Heart className="h-5 w-5" fill="currentColor" /> {t.brand.name}
          </Link>
          <div className="min-w-0">
            <h2 className="font-display text-4xl font-semibold leading-tight text-balance">{t.brand.tagline}</h2>
            <p className="mt-3 max-w-md text-primary-foreground/85">{t.hero.sub}</p>
          </div>
          <div className="text-xs text-primary-foreground/80">{t.footer.copyright}</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display font-semibold text-burgundy md:hidden">
            <Heart className="h-4 w-4 shrink-0 text-primary" fill="currentColor" />
            <span className="truncate">{t.brand.name}</span>
          </Link>
          <div className="ml-auto"><LanguageToggle /></div>
        </div>

        <div className="flex flex-1 items-start justify-center px-4 pb-10 pt-2 sm:items-center sm:p-6">
          <div className="w-full min-w-0 max-w-md">
            <h1 className="font-display text-2xl font-semibold text-burgundy sm:text-3xl">
              {mode === "join" ? t.auth.joinTitle : t.auth.signinTitle}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "join" ? t.auth.joinSub : t.auth.signinSub}
            </p>

            <form
              onSubmit={mode === "join" ? handleJoin : handleSignIn}
              className="mt-6 space-y-4 sm:mt-7"
              noValidate
            >
              {mode === "join" && (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">{t.auth.displayName}</Label>
                  <Input
                    id="displayName"
                    name="name"
                    autoComplete="name"
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value); clearError("displayName"); }}
                    required
                    maxLength={60}
                    aria-invalid={!!errors.displayName}
                    aria-describedby={errors.displayName ? "displayName-error" : undefined}
                    className={cn("w-full min-w-0", errors.displayName && "border-destructive focus-visible:ring-destructive")}
                  />
                  {fieldError("displayName", errors.displayName)}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError("email"); }}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn("w-full min-w-0", errors.email && "border-destructive focus-visible:ring-destructive")}
                />
                {fieldError("email", errors.email)}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "join" ? "new-password" : "current-password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError("password"); }}
                  required
                  minLength={8}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={cn("w-full min-w-0", errors.password && "border-destructive focus-visible:ring-destructive")}
                />
                {fieldError("password", errors.password)}
              </div>

              {mode === "join" && (
                <>
                  <div className="space-y-2">
                    <Label>{t.auth.iAm}</Label>
                    <RadioGroup
                      value={accountType}
                      onValueChange={(v: any) => setAccountType(v)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <label className={cn(
                        "flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-smooth",
                        accountType === "female_user" ? "border-primary bg-primary-soft/40" : "border-border",
                      )}>
                        <RadioGroupItem value="female_user" className="shrink-0" />
                        <span className="truncate">{t.auth.woman}</span>
                      </label>
                      <label className={cn(
                        "flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-smooth",
                        accountType === "male_user" ? "border-primary bg-primary-soft/40" : "border-border",
                      )}>
                        <RadioGroupItem value="male_user" className="shrink-0" />
                        <span className="truncate">{t.auth.man}</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="intention">{t.auth.intentionLabel}</Label>
                    <Select value={intention} onValueChange={(v: any) => setIntention(v)}>
                      <SelectTrigger id="intention" className="w-full min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)]">
                        <SelectItem value="marriage">{t.auth.intent.marriage}</SelectItem>
                        <SelectItem value="serious_relationship">{t.auth.intent.serious}</SelectItem>
                        <SelectItem value="travel_and_meet">{t.auth.intent.travel}</SelectItem>
                        <SelectItem value="friendship_first">{t.auth.intent.friendship}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex min-w-0 items-start gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={ageOk}
                        onCheckedChange={(v) => { setAgeOk(!!v); clearError("ageConfirmed"); }}
                        className="mt-0.5 shrink-0"
                        aria-invalid={!!errors.ageConfirmed}
                        aria-describedby={errors.ageConfirmed ? "age-error" : undefined}
                      />
                      <span className="min-w-0 break-words">{t.auth.ageConfirm}</span>
                    </label>
                    {fieldError("age", errors.ageConfirmed)}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex min-w-0 items-start gap-2 text-sm text-foreground/80">
                      <Checkbox
                        checked={rulesOk}
                        onCheckedChange={(v) => { setRulesOk(!!v); clearError("rulesAccepted"); }}
                        className="mt-0.5 shrink-0"
                        aria-invalid={!!errors.rulesAccepted}
                        aria-describedby={errors.rulesAccepted ? "rules-error" : undefined}
                      />
                      <span className="min-w-0 break-words">{t.auth.rules}</span>
                    </label>
                    {fieldError("rules", errors.rulesAccepted)}
                  </div>
                </>
              )}

              <Button type="submit" disabled={busy} variant="romance" className="w-full" size="lg">
                {busy ? t.common.loading : mode === "join" ? t.auth.submitJoin : t.auth.submitSignin}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setMode(mode === "join" ? "signin" : "join"); setErrors({}); }}
              className="mt-5 block w-full break-words text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "join" ? t.auth.switchToSignin : t.auth.switchToJoin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
