import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, BadgeCheck, Sparkles, MessageCircle } from "lucide-react";
import { AppLayout, EmptyState, PageHeader } from "@/components/layout/AppLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ComplianceCard } from "@/components/dashboard/ComplianceCard";
import { PolicyReminderBanner } from "@/components/dashboard/PolicyReminderBanner";
import { MyGiftsCard } from "@/components/dashboard/MyGiftsCard";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const completeness = profile ? computeCompleteness(profile) : 0;

  return (
    <AppLayout>
      <PageHeader
        title={`${t.dashboard.welcome}${profile?.display_name ? ", " + profile.display_name : ""}`}
        sub={t.dashboard.complete}
      />

      <PolicyReminderBanner />

      <div className="grid gap-5 md:grid-cols-3">
        <Card icon={<BadgeCheck className="h-5 w-5" />} title="Profile completeness" value={`${completeness}%`}>
          <Progress value={completeness} className="mt-3" />
          {completeness < 100 && (
            <Button asChild size="sm" variant="soft" className="mt-4"><Link to="/profile">Continue</Link></Button>
          )}
        </Card>
        <Card icon={<Sparkles className="h-5 w-5" />} title="Verification" value="Not started">
          <p className="mt-2 text-sm text-muted-foreground">Earn verified badges to build trust.</p>
          <Button asChild size="sm" variant="soft" className="mt-4"><Link to="/profile">Start</Link></Button>
        </Card>
        <Card icon={<MessageCircle className="h-5 w-5" />} title="Messages" value="0">
          <p className="mt-2 text-sm text-muted-foreground">Conversations open in the next phase.</p>
        </Card>
      </div>

      <div className="mt-6">
        <ComplianceCard />
      </div>

      <div className="mt-8">
        <EmptyState
          icon={<Heart className="h-5 w-5" fill="currentColor" />}
          title={t.dashboard.placeholderTitle}
          body={t.dashboard.placeholderBody}
        />
      </div>
    </AppLayout>
  );
}

function Card({ icon, title, value, children }: { icon: React.ReactNode; title: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-burgundy">{value}</div>
      {children}
    </div>
  );
}

function computeCompleteness(p: any): number {
  const fields = ["display_name", "country", "city", "bio", "relationship_intention", "date_of_birth"];
  const filled = fields.filter(f => p?.[f]).length;
  return Math.round((filled / fields.length) * 100);
}
