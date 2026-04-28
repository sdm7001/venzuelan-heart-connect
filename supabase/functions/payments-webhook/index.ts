import { createClient } from "npm:@supabase/supabase-js@2";
import { compareTier, priceIdToTier, type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

function tsToIso(s?: number | null): string | null {
  return s ? new Date(s * 1000).toISOString() : null;
}

async function logBilling(
  userId: string,
  eventType:
    | "subscription_created"
    | "subscription_renewed"
    | "subscription_canceled"
    | "subscription_upgraded"
    | "subscription_downgraded"
    | "credit_purchase"
    | "refund"
    | "failed_payment",
  amountCents: number | null,
  currency: string | null,
  metadata: Record<string, unknown>,
) {
  await getSupabase().from("billing_events").insert({
    user_id: userId,
    event_type: eventType,
    amount_cents: amountCents,
    currency: (currency ?? "USD").toUpperCase(),
    metadata,
  } as never);
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const tier = priceIdToTier(priceId);

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      tier: tier ?? "level_1",
      status: subscription.status,
      current_period_start: tsToIso(periodStart),
      current_period_end: tsToIso(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "stripe_subscription_id" },
  );

  await logBilling(
    userId,
    "subscription_created",
    item?.price?.unit_amount ?? null,
    item?.price?.currency ?? null,
    { stripe_subscription_id: subscription.id, price_id: priceId, tier, environment: env },
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const newTier = priceIdToTier(priceId);

  // Find existing row to detect upgrade/downgrade
  const { data: existing } = await getSupabase()
    .from("subscriptions")
    .select("tier, status")
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .maybeSingle();

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      tier: newTier ?? (existing?.tier as never) ?? "level_1",
      current_period_start: tsToIso(periodStart),
      current_period_end: tsToIso(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  if (userId && existing?.tier && newTier && newTier !== existing.tier) {
    const cmp = compareTier(newTier, existing.tier as string);
    if (cmp > 0) {
      await logBilling(userId, "subscription_upgraded", item?.price?.unit_amount ?? null, item?.price?.currency ?? null, {
        from_tier: existing.tier, to_tier: newTier, stripe_subscription_id: subscription.id, environment: env,
      });
    } else if (cmp < 0) {
      await logBilling(userId, "subscription_downgraded", item?.price?.unit_amount ?? null, item?.price?.currency ?? null, {
        from_tier: existing.tier, to_tier: newTier, stripe_subscription_id: subscription.id, environment: env,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  if (userId) {
    await logBilling(userId, "subscription_canceled", null, null, {
      stripe_subscription_id: subscription.id, environment: env,
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  // Only log renewals (not the very first invoice — that's covered by subscription_created)
  if (invoice.billing_reason !== "subscription_cycle") return;

  const { data: sub } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .maybeSingle();
  if (!sub?.user_id) return;

  await logBilling(
    sub.user_id as string,
    "subscription_renewed",
    invoice.amount_paid ?? null,
    invoice.currency ?? null,
    { stripe_subscription_id: subId, invoice_id: invoice.id, environment: env },
  );
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  const { data: sub } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .maybeSingle();
  if (!sub?.user_id) return;

  await logBilling(
    sub.user_id as string,
    "failed_payment",
    invoice.amount_due ?? null,
    invoice.currency ?? null,
    { stripe_subscription_id: subId, invoice_id: invoice.id, environment: env },
  );
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  console.log("Stripe event:", event.type, "env:", env);

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env); break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env); break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env); break;
    case "invoice.payment_succeeded":
    case "invoice.paid":
      await handleInvoicePaymentSucceeded(event.data.object, env); break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object, env); break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
