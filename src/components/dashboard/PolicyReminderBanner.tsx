import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { usePolicyConfig, type PolicyKey } from "@/lib/policyConfig";
import { Button } from "@/components/ui/button";

type Reminder = {
  id: string;
  policy_version: string;
  missing_keys: string[];
  created_at: string;
};

const POLICY_LABEL_KEY: Record<PolicyKey, "tos" | "privacy" | "aup" | "antiSolicit"> = {
  tos: "tos",
  privacy: "privacy",
  aup: "aup",
  anti_solicitation: "antiSolicit",
};

/**
 * Dashboard banner shown when an admin has sent the user a re-acceptance
 * reminder for the active policy_version. The banner persists across page
 * loads (it's backed by a real `policy_reminders` row) and is dismissed
 * either explicitly via the close button or implicitly when the user
 * re-accepts and the row is no longer relevant for the active version.
 */
export function PolicyReminderBanner() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { config } = usePolicyConfig();
  const [reminder, setReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("policy_reminders")
      .select("id, policy_version, missing_keys, created_at")
      .eq("user_id", user.id)
      .eq("policy_version", config.policy_version)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (active) setReminder((data as Reminder) ?? null); });
    return () => { active = false; };
  }, [user?.id, config.policy_version]);

  if (!reminder) return null;

  async function dismiss() {
    if (!reminder) return;
    await supabase
      .from("policy_reminders")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", reminder.id);
    setReminder(null);
  }

  const missingLabels = (reminder.missing_keys as PolicyKey[])
    .map(k => t.legal[POLICY_LABEL_KEY[k]])
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3 text-sm text-amber-900">
        <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <div className="font-medium">
            Action needed: please re-accept our updated policies (v{reminder.policy_version}).
          </div>
          {missingLabels && (
            <div className="mt-0.5 text-xs text-amber-800/90">Still required: {missingLabels}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button asChild size="sm" variant="romance">
          <Link to="/dashboard">Review &amp; accept</Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismiss}
          aria-label="Dismiss reminder"
          className="text-amber-900 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default PolicyReminderBanner;
