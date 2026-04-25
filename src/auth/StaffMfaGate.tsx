// Backwards-compat re-export. Prefer importing StaffOtpGate directly.
export { StaffOtpGate as StaffMfaGate } from "./StaffOtpGate";

// --- Legacy password-only gate kept below for reference; no longer rendered. ---
import { ReactNode, useEffect, useState } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VALIDITY_HOURS = 12;
const VALIDITY_MS = VALIDITY_HOURS * 60 * 60 * 1000;

/**
 * Step-up re-authentication gate for all staff routes.
 * Requires the user to re-enter their password every 12h before accessing /admin.
 *
 * NOTE: This is a "soft" MFA gate (knowledge factor only). It defends against
 * an unattended/hijacked session, NOT a stolen password. Replace this component
 * with an Email-OTP variant (same props/contract) once email infra is ready
 * to upgrade to a true second factor.
 */
function LegacyStaffMfaGate({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [checked, setChecked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("staff_step_up")
        .select("verified_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const ts = data?.verified_at ? new Date(data.verified_at).getTime() : 0;
      setVerified(Date.now() - ts < VALIDITY_MS);
      setChecked(true);
    })();
    return () => { active = false; };
  }, [user]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email || !password) return;
    setBusy(true);
    setError(null);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (authErr) {
      setBusy(false);
      setError("Incorrect password. Please try again.");
      return;
    }
    const nowIso = new Date().toISOString();
    const { error: upsertErr } = await supabase
      .from("staff_step_up")
      .upsert({ user_id: user.id, verified_at: nowIso, method: "password" });
    setBusy(false);
    if (upsertErr) {
      setError("Couldn't record verification. Please try again.");
      return;
    }
    setPassword("");
    setVerified(true);
    toast.success("Verified. Welcome back.");
  }

  async function handleCancel() {
    await signOut();
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

        <p className="mb-5 text-sm text-muted-foreground">
          For your team's safety, please re-enter your password before opening
          admin tools.
        </p>

        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="step-up-email">Email</Label>
            <Input
              id="step-up-email"
              value={user?.email ?? ""}
              readOnly
              disabled
              className="bg-muted/40"
            />
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

          <Button
            type="submit"
            variant="romance"
            size="lg"
            className="w-full"
            disabled={busy || !password}
          >
            {busy ? "Verifying…" : "Verify and continue"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleCancel}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out instead
          </Button>
        </form>
      </div>
    </div>
  );
}
