import { createClient } from "npm:@supabase/supabase-js@2";
import { compareTier, createStripeClient, priceIdToTier, type StripeEnv } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { newPriceId, environment } = await req.json();

    if (!newPriceId || !/^[a-zA-Z0-9_-]+$/.test(newPriceId)) {
      return new Response(JSON.stringify({ error: "Invalid newPriceId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (environment !== "sandbox" && environment !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const env: StripeEnv = environment;

    // Authenticate
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the user's current active subscription in this env
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, tier, price_id, status")
      .eq("user_id", user.id)
      .eq("environment", env)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "no_active_subscription" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newTier = priceIdToTier(newPriceId);
    if (!newTier) {
      return new Response(JSON.stringify({ error: "unknown_tier" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sub.tier === newTier) {
      return new Response(JSON.stringify({ error: "already_on_tier" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);

    // Resolve the new Stripe price via lookup_keys
    const prices = await stripe.prices.list({ lookup_keys: [newPriceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "price_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const newStripePrice = prices.data[0];

    // Get the live subscription with items
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) {
      return new Response(JSON.stringify({ error: "no_subscription_item" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cmp = compareTier(newTier, sub.tier as string);
    const isUpgrade = cmp > 0;

    let effective: "now" | "period_end";
    let resultMessage: string;

    if (isUpgrade) {
      // UPGRADE: apply immediately, prorate, invoice now, reset cycle
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: itemId, price: newStripePrice.id }],
        proration_behavior: "always_invoice",
        billing_cycle_anchor: "now",
        cancel_at_period_end: false,
        metadata: { ...stripeSub.metadata, lovable_price_id: newPriceId },
      });
      effective = "now";
      resultMessage = "Upgrade applied. You've been charged a prorated amount and your new plan is active immediately.";
    } else {
      // DOWNGRADE: schedule change at end of current billing period using Subscription Schedules
      // 1. Create a schedule from the existing subscription
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: sub.stripe_subscription_id,
      });

      // 2. The schedule's first phase mirrors the current subscription. Append a
      //    second phase that switches to the new price at the end of phase 1.
      const currentPhase = schedule.phases[0];
      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: "release",
        phases: [
          {
            items: currentPhase.items.map((i: any) => ({
              price: i.price,
              quantity: i.quantity ?? 1,
            })),
            start_date: currentPhase.start_date,
            end_date: currentPhase.end_date,
            proration_behavior: "none",
          },
          {
            items: [{ price: newStripePrice.id, quantity: 1 }],
            iterations: 1,
            proration_behavior: "none",
            metadata: { lovable_price_id: newPriceId },
          },
        ],
        metadata: { lovable_price_id: newPriceId, scheduled_change: "downgrade" },
      });

      effective = "period_end";
      resultMessage = "Downgrade scheduled. You'll keep your current plan until the end of this billing period, then switch automatically.";
    }

    // Audit log: billing_events for finance trail + audit_events for the
    // canonical project audit log. Webhook will also fire when Stripe applies
    // the change, so the trail captures both "user requested" and "provider
    // applied" sides with timestamps.
    const auditMeta = {
      from_tier: sub.tier,
      to_tier: newTier,
      from_price_id: sub.price_id,
      to_price_id: newPriceId,
      stripe_subscription_id: sub.stripe_subscription_id,
      effective,
      scheduled: !isUpgrade,
      environment: env,
      requested_at: new Date().toISOString(),
    };

    await supabase.from("billing_events").insert({
      user_id: user.id,
      event_type: isUpgrade ? "subscription_upgraded" : "subscription_downgraded",
      amount_cents: null,
      currency: "USD",
      metadata: auditMeta,
    } as never);

    await supabase.from("audit_events").insert({
      actor_id: user.id,
      subject_id: user.id,
      category: "billing",
      action: isUpgrade ? "subscription_upgrade_requested" : "subscription_downgrade_scheduled",
      metadata: { ...auditMeta, source: "user_action" },
    } as never);

    return new Response(JSON.stringify({
      ok: true,
      effective,
      message: resultMessage,
      from_tier: sub.tier,
      to_tier: newTier,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("change-subscription error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
