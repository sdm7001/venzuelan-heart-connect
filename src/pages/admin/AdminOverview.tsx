import { useEffect, useState } from "react";
import { AdminLayout, AdminPageHeader } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Users, Flag, ShieldAlert, BadgeCheck } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, reports: 0, flags: 0, verifications: 0 });
  useEffect(() => {
    (async () => {
      const [u, r, f, v] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }).neq("status", "closed"),
        supabase.from("moderation_flags").select("id", { count: "exact", head: true }).neq("status", "closed"),
        supabase.from("verification_requests").select("id", { count: "exact", head: true }).in("status", ["submitted","under_review","needs_more_info"]),
      ]);
      setStats({ users: u.count ?? 0, reports: r.count ?? 0, flags: f.count ?? 0, verifications: v.count ?? 0 });
    })();
  }, []);

  const cards = [
    { label: "Total members", value: stats.users, icon: Users },
    { label: "Open reports", value: stats.reports, icon: Flag },
    { label: "Active flags", value: stats.flags, icon: ShieldAlert },
    { label: "Verifications pending", value: stats.verifications, icon: BadgeCheck },
  ];

  return (
    <AdminLayout>
      <AdminPageHeader title="Overview" sub="Operational health of MatchVenezuelan" />
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
