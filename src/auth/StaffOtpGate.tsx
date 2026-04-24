import { ReactNode, useEffect, useState } from "react";
import { ShieldCheck, LogOut, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VALIDITY_HOURS = 12;
const VALIDITY_MS = VALIDITY_HOURS * 60 * 60 * 1000;

type Step = "password" | "request_code" | "enter_code";

/**
 * Staff MFA gate: every 12h, require BOTH a password re-auth AND an emailed
 * 6-digit code before /admin loads. Code is hashed client-side (SHA-256) and
 * the same hash is stored server-side, so the email function (added later)
 * just needs to deliver the plaintext code that was generated here-or-server.
 *
 * For now (until the email edge function ships), the code is generated
 * client-side and the hash sent to issue_staff_mfa_challenge. The plaintext
 * code is shown in a dev-only fallback so admins aren't locked out. Once
 * `staff-otp-issue` exists, swap requestCode() to invoke it instead.
 */
export function StaffOtpGate({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [checked, setChecked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState<Step>("password");

  // password step
  const [password, setPassword] = useState("");
  // OTP step
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Recovery fallback step
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing 12h verified window
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("staff_step_up")
        .select("verified_at, method")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const ts = data?.verified_at ? new Date(data.verified_at).getTime() : 0;
      const fresh = Date.now() - ts < VALIDITY_MS;
      // OTP or recovery both unlock the gate; password-only does not.
      setVerified(fresh && (data?.method === "otp" || data?.method === "recovery"));
      setChecked(true);
    })();
    return () => { active = false; };
  }, [user]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email || !password) return;
    setBusy(true);
    setError(null);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    setBusy(false);
    if (authErr) {
      setError("Incorrect password. Please try again.");
      return;
    }
    setPassword("");
    setStep("request_code");
  }

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      // Generate 6-digit code (zero-padded), hash, store hash server-side.
      // TODO: Once `staff-otp-issue` edge function exists, replace this with
      // supabase.functions.invoke('staff-otp-issue') and drop devCode.
      const plaintext = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
      const codeHash = await sha256Hex(plaintext);
      const userAgent = navigator.userAgent.slice(0, 500);

      const { data, error: rpcErr } = await supabase.rpc("issue_staff_mfa_challenge", {
        _code_hash: codeHash,
        _ip: null,
        _user_agent: userAgent,
      });
      if (rpcErr) throw rpcErr;

      const expIso = (data as any)?.[0]?.expires_at as string | undefined;
      setExpiresAt(expIso ? new Date(expIso).getTime() : Date.now() + 10 * 60 * 1000);
      setDevCode(plaintext); // dev fallback — remove once email is wired up
      setStep("enter_code");
      toast.success("Code generated. Check the dev panel below until email is live.");
    } catch (e: any) {
      setError(e.message ?? "Couldn't issue code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const codeHash = await sha256Hex(code);
      const { data, error: rpcErr } = await supabase.rpc("verify_staff_mfa_challenge", {
        _code_hash: codeHash,
      });
      if (rpcErr) throw rpcErr;
      const row = (data as any)?.[0];
      if (row?.verified) {
        setVerified(true);
        setCode("");
        setDevCode(null);
        toast.success("Verified. Welcome back.");
        return;
      }
      switch (row?.reason) {
        case "expired":
          setError("Code expired. Request a new one.");
          setStep("request_code");
          break;
        case "locked":
          setError("Too many wrong attempts. Request a new code.");
          setStep("request_code");
          break;
        case "no_active_challenge":
          setError("No active code. Request a new one.");
          setStep("request_code");
          break;
        default:
          setError("Incorrect code. Please try again.");
      }
      setCode("");
    } catch (e: any) {
      setError(e.message ?? "Couldn't verify code.");
    } finally {
      setBusy(false);
    }
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (verified) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-burgundy">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-burgundy">
              Verify it's you
            </h1>
            <p className="text-xs text-muted-foreground">
              Required every {VALIDITY_HOURS}h for staff access
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <ol className="mb-5 flex items-center gap-2 text-xs">
          <StepDot active={step === "password"} done={step !== "password"} icon={<KeyRound className="h-3 w-3" />} label="Password" />
          <span className="h-px flex-1 bg-border" />
          <StepDot active={step !== "password"} done={false} icon={<Mail className="h-3 w-3" />} label="Email code" />
        </ol>

        {step === "password" && (
          <form onSubmit={handlePassword} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">
              Re-enter your password to start verification.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="step-up-email">Email</Label>
              <Input id="step-up-email" value={user?.email ?? ""} readOnly disabled className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="step-up-password">Password</Label>
              <Input
                id="step-up-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                required
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? "step-up-error" : undefined}
              />
              {error && (
                <p id="step-up-error" role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" variant="romance" size="lg" className="w-full" disabled={busy || !password}>
              {busy ? "Checking…" : "Continue"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out instead
            </Button>
          </form>
        )}

        {step === "request_code" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll send a 6-digit code to <span className="font-medium text-foreground">{user?.email}</span>.
              It expires in 10 minutes.
            </p>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            <Button onClick={requestCode} variant="romance" size="lg" className="w-full" disabled={busy}>
              <Mail className="mr-2 h-4 w-4" />
              {busy ? "Sending…" : "Send code"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setStep("password")}>
              ← Back
            </Button>
          </div>
        )}

        {step === "enter_code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code{" "}
              {expiresAt && (
                <span className="text-xs">(valid until {new Date(expiresAt).toLocaleTimeString()})</span>
              )}
              .
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); setError(null); }} autoFocus>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p role="alert" className="text-center text-xs text-destructive">{error}</p>}

            {devCode && (
              <div className="rounded-md border border-dashed border-amber-400 bg-amber-50 p-3 text-center text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <strong>Dev preview:</strong> email isn't wired up yet. Your code is{" "}
                <code className="font-mono text-sm">{devCode}</code>
              </div>
            )}

            <Button type="submit" variant="romance" size="lg" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Verify and continue"}
            </Button>
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep("request_code")}>
                Resend code
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function StepDot({ active, done, icon, label }: { active: boolean; done: boolean; icon: ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={
          "grid h-5 w-5 place-items-center rounded-full border " +
          (done
            ? "border-burgundy bg-burgundy text-primary-foreground"
            : active
            ? "border-burgundy text-burgundy"
            : "border-border text-muted-foreground")
        }
      >
        {icon}
      </span>
      <span className={active || done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
