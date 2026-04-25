import { useEffect, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Flag, ShieldAlert, BadgeCheck, Sparkles, Copy, CheckCircle2, Award } from "lucide-react";
import { toast } from "sonner";

type SeedSummary = {
  ok: boolean;
  summary: { users: number; reports: number; moderation_actions: number; flags: number; verifications: number; billing_events: number };
  demo_credentials: { password: string; accounts: { email: string; role: string }[] };
};

export default function AdminOverview() {
  const { isAdmin, user } = useAuth();
  const [stats, setStats] = useState({ users: 0, reports: 0, flags: 0, verifications: 0 });
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<SeedSummary | null>(null);
  const [foundingEnabled, setFoundingEnabled] = useState<boolean | null>(null);
  const [foundingSaving, setFoundingSaving] = useState(false);

  async function loadStats() {
    const [u, r, f, v] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }).neq("status", "closed"),
      supabase.from("moderation_flags").select("id", { count: "exact", head: true }).neq("status", "closed"),
      supabase.from("verification_requests").select("id", { count: "exact", head: true }).in("status", ["submitted","under_review","needs_more_info"]),
    ]);
    setStats({ users: u.count ?? 0, reports: r.count ?? 0, flags: f.count ?? 0, verifications: v.count ?? 0 });
  }

  async function loadFoundingSetting() {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "founding_member_enabled")
      .maybeSingle();
    setFoundingEnabled(data?.value === true || (data?.value as any) === "true");
  }

  useEffect(() => { void loadStats(); void loadFoundingSetting(); }, []);

  async function toggleFounding(next: boolean) {
    if (!isAdmin || !user) return;
    setFoundingSaving(true);
    const prev = foundingEnabled;
    setFoundingEnabled(next);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "founding_member_enabled", value: next as any, updated_by: user.id, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (error) throw error;
      await supabase.from("app_settings_history").insert({
        key: "founding_member_enabled",
        value: next as any,
        changed_by: user.id,
      });
      await supabase.from("audit_events").insert({
        actor_id: user.id,
        subject_id: user.id,
        category: "moderation",
        action: "founding_member_toggle",
        metadata: { enabled: next },
      });
      toast.success(next ? "Founding Member auto-award enabled" : "Founding Member auto-award disabled");
    } catch (e: any) {
      setFoundingEnabled(prev);
      toast.error(e?.message ?? "Failed to update setting");
    } finally {
      setFoundingSaving(false);
    }
  }

  async function runSeed() {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo", { body: {} });
      if (error) throw error;
      const res = data as SeedSummary;
      setResult(res);
      toast.success(`Seeded ${res.summary.users} users, ${res.summary.reports} reports, ${res.summary.billing_events} billing events.`);
      await loadStats();
    } catch (e: any) {
      toast.error(e?.message ?? "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  async function copyCreds() {
    if (!result) return;
    const text = result.demo_credentials.accounts
      .map(a => `${a.email}\t${result.demo_credentials.password}\t${a.role}`).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Demo credentials copied to clipboard.");
  }

  const cards = [
    { label: "Total members", value: stats.users, icon: Users },
    { label: "Open reports", value: stats.reports, icon: Flag },
    { label: "Active flags", value: stats.flags, icon: ShieldAlert },
    { label: "Verifications pending", value: stats.verifications, icon: BadgeCheck },
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Overview"
        sub="Operational health of MatchVenezuelan"
        action={isAdmin ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="mr-2 h-4 w-4 text-primary" /> Seed demo data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Seed demo data?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">This will create (or refresh) the following demo accounts and append a fresh batch of sample data so you can stress-test queues:</span>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground">
                    <li>4 staff accounts (admin, moderator, support, verifier) and 7 member profiles</li>
                    <li>7 sample reports across categories and statuses</li>
                    <li>3 system flags, 4 verification requests, 7 billing events, credit wallets</li>
                    <li>One <code className="text-xs">demo_data_seeded</code> entry in the audit log</li>
                  </ul>
                  <span className="block text-xs">All seeded rows are tagged <code>[seed]</code> so they're easy to spot. Re-running appends a new batch — it does not delete previous data.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void runSeed()} disabled={seeding}>
                  {seeding ? "Seeding…" : "Run seed"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : undefined}
      />

      {result && (
        <div className="mb-6 rounded-2xl border border-success/30 bg-success/5 p-5 shadow-card">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-semibold text-foreground">Demo data ready</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign out, then sign in with any account below (password the same for all). Browse <code>/admin/reports</code>, <code>/admin/audit</code>, and the user app to verify P0.
              </p>
              <div className="mt-3 overflow-hidden rounded-md border border-border bg-card text-xs">
                <table className="w-full">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.demo_credentials.accounts.map(a => (
                      <tr key={a.email} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{a.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span>Password for all demo accounts: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{result.demo_credentials.password}</code></span>
                <Button size="sm" variant="ghost" onClick={copyCreds}>
                  <Copy className="mr-1 h-3 w-3" /> Copy all
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10">
                <Award className="h-4 w-4 text-primary" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Founding Member auto-award</h3>
                <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                  When enabled, every new signup is automatically granted the “Founding Member” trust badge. Turn off to stop awarding it to future accounts. Existing badges are not affected.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="founding-toggle" className="text-xs text-muted-foreground">
                {foundingEnabled === null ? "Loading…" : foundingEnabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="founding-toggle"
                checked={!!foundingEnabled}
                disabled={foundingEnabled === null || foundingSaving}
                onCheckedChange={(v) => void toggleFounding(v)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">{c.label}</span>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-semibold text-burgundy">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Panel title="Moderation workflow" body="Reports and behavior flags flow into a triage queue. Moderators can warn, restrict, suspend, or ban — every action is written to the audit log." />
        <Panel title="Verification workflow" body="Members can request photo, social, ID, income, background-check (placeholder) and Concierge Verified review. Reviewers approve, reject, or request more info." />
        <Panel title="Billing readiness" body="Subscription tiers (level_1, level_2, premium, concierge_verified) and credit wallets are wired. Stripe integration arrives in P1." />
        <Panel title="Compliance" body="Every moderation action, verification decision, billing event, role grant and policy acknowledgement is captured in audit_events." />
      </div>
    </AdminLayout>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
