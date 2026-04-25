import { useEffect, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Download, Copy, RefreshCw, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { sha256Hex, generateRecoveryCode } from "@/auth/mfaCrypto";

const CODE_COUNT = 10;

export default function AdminMfaRecoveryCodes() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);

  async function refresh() {
    const { data, error } = await supabase.rpc("count_active_staff_recovery_codes");
    if (!error) setRemaining((data as number) ?? 0);
  }

  useEffect(() => { void refresh(); }, [user?.id]);

  async function generate() {
    setBusy(true);
    try {
      const plaintexts = Array.from({ length: CODE_COUNT }, () => generateRecoveryCode());
      const hashes = await Promise.all(plaintexts.map(sha256Hex));
      const { error } = await supabase.rpc("generate_staff_recovery_codes", { _code_hashes: hashes });
      if (error) throw error;
      setFreshCodes(plaintexts);
      await refresh();
      toast.success("New recovery codes generated. Save them now — they won't be shown again.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate codes.");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  function copyAll() {
    if (!freshCodes) return;
    void navigator.clipboard.writeText(freshCodes.join("\n"));
    toast.success("Copied to clipboard.");
  }

  function downloadTxt() {
    if (!freshCodes) return;
    const blob = new Blob(
      [
        `MatchVenezuelan staff MFA recovery codes\n`,
        `Account: ${user?.email}\n`,
        `Generated: ${new Date().toISOString()}\n\n`,
        `Each code can be used ONCE. Store them somewhere safe (password manager).\n\n`,
        ...freshCodes.map((c, i) => `${String(i + 1).padStart(2, "0")}. ${c}\n`),
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mv-staff-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="MFA recovery codes"
        sub="One-time codes used as a fallback if the email OTP doesn't arrive."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-burgundy">
              <KeyRound className="h-5 w-5" /> Your codes
            </CardTitle>
            <CardDescription>
              Each code works once. After you use a code, generate a new set when you're running low.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
              <div>
                <div className="text-sm text-muted-foreground">Active codes</div>
                <div className="font-display text-2xl font-semibold text-burgundy">
                  {remaining ?? "—"}
                  <span className="ml-1 text-base text-muted-foreground">/ {CODE_COUNT}</span>
                </div>
              </div>
              <Button onClick={() => setConfirmOpen(true)} disabled={busy} variant="romance">
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate new set
              </Button>
            </div>

            {remaining !== null && remaining <= 2 && remaining > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4" />
                <span>You're running low on recovery codes. Generate a new set soon.</span>
              </div>
            )}
            {remaining === 0 && (
              <div className="flex items-start gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4" />
                <span>You have no recovery codes. If email OTP fails, you'll be locked out of admin.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-burgundy">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. If your email OTP doesn't arrive, click <strong>Code not arriving?</strong> on the verify screen.</p>
            <p>2. Re-enter your password and one recovery code.</p>
            <p>3. The code is consumed and the use is logged in the audit log.</p>
          </CardContent>
        </Card>
      </div>

      {/* Confirm regen */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate a new set of recovery codes?</AlertDialogTitle>
            <AlertDialogDescription>
              This invalidates any unused codes you currently have. The new codes are shown only once — make
              sure you save them before closing the dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generate} disabled={busy}>
              {busy ? "Generating…" : "Generate codes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Show fresh codes once */}
      <AlertDialog open={!!freshCodes} onOpenChange={(o) => !o && setFreshCodes(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Save your recovery codes</AlertDialogTitle>
            <AlertDialogDescription>
              These codes will <strong>not be shown again</strong>. Store them in your password manager
              or download the file below. Each code works once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-3 font-mono text-sm">
            {freshCodes?.map((c, i) => (
              <div key={c} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}.</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={copyAll} type="button">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" onClick={downloadTxt} type="button">
              <Download className="mr-2 h-4 w-4" /> Download .txt
            </Button>
            <AlertDialogAction onClick={() => setFreshCodes(null)}>I've saved them</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
