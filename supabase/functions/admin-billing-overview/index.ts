// Read-only admin billing overview: pricing (from Stripe), recent checkout
// sessions (from Stripe), and webhook health summary.
// Access: any authenticated staff (admin/moderator/support/verification_reviewer).
// Sensitive fields (raw amounts, customer emails) are returned only when
// caller has the `admin` role.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

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
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const isStaff = ["admin", "moderator", "support", "verification_reviewer"]
      .some((r) => roleSet.has(r));
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isAdmin = roleSet.has("admin");

    const { environment } = await req.json().catch(() => ({}));
    const env: StripeEnv = environment === "live" ? "live" : "sandbox";

    const stripe = createStripeClient(env);

    // ── Pricing: list active prices for our 3 known products
    const productIds = ["male_level_1", "male_level_2", "male_premium"];
    const productPromises = productIds.map((id) =>
      stripe.products.retrieve(id).catch(() => null),
    );
    const products = (await Promise.all(productPromises)).filter(Boolean) as any[];
    const allPrices = await stripe.prices.list({ active: true, limit: 50, expand: ["data.product"] });
    const pricing = products.map((p) => {
      const prices = allPrices.data
        .filter((pr: any) => (typeof pr.product === "string" ? pr.product : pr.product?.id) === p.id)
        .map((pr: any) => ({
          id: pr.id,
          lookup_key: pr.lookup_key ?? pr.metadata?.lovable_external_id ?? null,
          unit_amount: pr.unit_amount,
          currency: pr.currency,
          interval: pr.recurring?.interval ?? null,
          active: pr.active,
        }));
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        active: p.active,
        prices,
      };
    });

    // ── Recent checkout sessions (last 25)
    const sessions = await stripe.checkout.sessions.list({ limit: 25 });
    const recentSessions = sessions.data.map((s: any) => ({
      id: s.id,
      created: s.created,
      status: s.status,
      payment_status: s.payment_status,
      mode: s.mode,
      amount_total: isAdmin ? s.amount_total : null,
      currency: s.currency,
      customer_email: isAdmin ? (s.customer_details?.email ?? s.customer_email ?? null) : null,
      metadata: s.metadata ?? null,
    }));

    // ── Webhook health
    const projectRef = (Deno.env.get("SUPABASE_URL") ?? "").match(/https:\/\/([^.]+)/)?.[1];
    const webhookUrl = projectRef
      ? `https://${projectRef}.supabase.co/functions/v1/payments-webhook?env=${env}`
      : null;
    const sandboxSecretSet = !!Deno.env.get("PAYMENTS_SANDBOX_WEBHOOK_SECRET");
    const liveSecretSet = !!Deno.env.get("PAYMENTS_LIVE_WEBHOOK_SECRET");

    let webhookEndpoints: any[] = [];
    try {
      const eps = await stripe.webhookEndpoints.list({ limit: 10 });
      webhookEndpoints = eps.data.map((e: any) => ({
        id: e.id,
        url: e.url,
        status: e.status,
        enabled_events_count: Array.isArray(e.enabled_events) ? e.enabled_events.length : 0,
        created: e.created,
      }));
    } catch (e) {
      console.warn("webhookEndpoints.list failed:", (e as Error).message);
    }

    // Recent webhook deliveries from billing_events as a proxy for "did webhooks land"
    const { data: recentBilling } = await supabase
      .from("billing_events")
      .select("event_type, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(20);

    return new Response(
      JSON.stringify({
        environment: env,
        is_admin: isAdmin,
        pricing,
        recent_sessions: recentSessions,
        webhook: {
          expected_url: webhookUrl,
          sandbox_secret_set: sandboxSecretSet,
          live_secret_set: liveSecretSet,
          endpoints: webhookEndpoints,
          recent_events: recentBilling ?? [],
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("admin-billing-overview error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
