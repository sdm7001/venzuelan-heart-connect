import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export type Entitlement = {
  tier: "level_1" | "level_2" | "premium" | "concierge_verified" | null;
  status: string;
  is_active: boolean;
  monthly_contact_limit: number | null; // null = unlimited
  contacts_used_this_period: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/**
 * Live, realtime view of the current user's entitlement (tier + contact limit).
 * Source of truth is `user_entitlements`, kept in sync by the payments webhook.
 */
export function useEntitlement(userId?: string | null) {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const env = getStripeEnvironment();

  useEffect(() => {
    if (!userId) {
      setEntitlement(null);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("user_entitlements")
        .select(
          "tier, status, is_active, monthly_contact_limit, contacts_used_this_period, current_period_start, current_period_end, cancel_at_period_end",
        )
        .eq("user_id", userId)
        .eq("environment", env)
        .maybeSingle();
      if (!cancelled) {
        setEntitlement((data as Entitlement) ?? null);
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`entitlement:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_entitlements",
          filter: `user_id=eq.${userId}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, env]);

  return { entitlement, loading };
}

/**
 * Atomically attempt to consume a monthly contact slot for `recipientId`.
 * Returns whether the contact was allowed and the updated counters.
 */
export async function consumeContact(recipientId: string) {
  const env = getStripeEnvironment();
  const { data, error } = await supabase.rpc("consume_contact", {
    _recipient_id: recipientId,
    _env: env,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as {
    allowed: boolean;
    reason: string;
    contacts_used: number;
    monthly_limit: number; // -1 means unlimited
  };
}
