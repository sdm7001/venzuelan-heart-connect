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

/**
 * Mirror every billing transition into audit_events so the full provider
 * trail (subscription id, customer id, price id, status, period dates) is
 * queryable alongside non-monetary events.
 */
async function logBillingAudit(
  userId: string | null,
  action:
    | "subscription_created"
    | "subscription_updated"
    | "subscription_canceled"
    | "subscription_renewed"
    | "subscription_upgraded"
    | "subscription_downgraded"
    | "subscription_cancel_scheduled"
    | "subscription_cancel_reverted"
    | "payment_failed",
  metadata: Record<string, unknown>,
) {
  await getSupabase().from("audit_events").insert({
    actor_id: null,
    subject_id: userId,
    category: "billing",
    action,
    metadata: { ...metadata, source: "stripe_webhook", recorded_at: new Date().toISOString() },
  } as never);
}

async function syncEntitlement(userId: string | null | undefined, env: StripeEnv) {
  if (!userId) return;
  const { error } = await getSupabase().rpc("recompute_user_entitlement" as never, {
    _user_id: userId,
    _env: env,
  } as never);
  if (error) console.error("recompute_user_entitlement failed:", error);
}

function subscriptionContext(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return {
    environment: env,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    stripe_price_id: item?.price?.id,
    lovable_price_id: priceId,
    product_id: item?.price?.product,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    current_period_start: tsToIso(periodStart),
    current_period_end: tsToIso(periodEnd),
    cancel_at: tsToIso(subscription.cancel_at),
    canceled_at: tsToIso(subscription.canceled_at),
  };
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

  // Defense-in-depth: ensure no other "active-like" rows exist for this user+env.
  // The DB has a partial unique index enforcing this, but we proactively demote
  // any stray rows (e.g. from out-of-order webhook delivery) to avoid conflicts.
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId)
    .eq("environment", env)
    .neq("stripe_subscription_id", subscription.id)
    .in("status", ["active", "trialing", "past_due"]);

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

  const ctx = subscriptionContext(subscription, env);
  await logBilling(
    userId,
    "subscription_created",
    item?.price?.unit_amount ?? null,
    item?.price?.currency ?? null,
    { ...ctx, tier },
  );
  await logBillingAudit(userId, "subscription_created", { ...ctx, tier });
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const newTier = priceIdToTier(priceId);

  // Find existing row to detect tier transitions and cancel-at-period-end toggles
  const { data: existing } = await getSupabase()
    .from("subscriptions")
    .select("tier, status, cancel_at_period_end")
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

  const ctx = subscriptionContext(subscription, env);

  // Always record the raw update in audit_events (full provider snapshot)
  await logBillingAudit(userId ?? null, "subscription_updated", {
    ...ctx,
    from_tier: existing?.tier ?? null,
    to_tier: newTier,
    from_status: existing?.status ?? null,
    from_cancel_at_period_end: existing?.cancel_at_period_end ?? null,
  });

  // Detect cancel-at-period-end toggle (user scheduled or reverted a cancel)
  const prevCancel = existing?.cancel_at_period_end ?? false;
  const nowCancel = subscription.cancel_at_period_end ?? false;
  if (userId && prevCancel !== nowCancel) {
    await logBillingAudit(
      userId,
      nowCancel ? "subscription_cancel_scheduled" : "subscription_cancel_reverted",
      ctx,
    );
  }

  if (userId && existing?.tier && newTier && newTier !== existing.tier) {
    const cmp = compareTier(newTier, existing.tier as string);
    const eventType = cmp > 0 ? "subscription_upgraded" : cmp < 0 ? "subscription_downgraded" : null;
    if (eventType) {
      const meta = {
        ...ctx,
        from_tier: existing.tier,
        to_tier: newTier,
      };
      await logBilling(userId, eventType, item?.price?.unit_amount ?? null, item?.price?.currency ?? null, meta);
      await logBillingAudit(userId, eventType, meta);
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

  const ctx = subscriptionContext(subscription, env);
  if (userId) {
    await logBilling(userId, "subscription_canceled", null, null, ctx);
  }
  await logBillingAudit(userId ?? null, "subscription_canceled", ctx);
}

async function handleInvoicePaymentSucceeded(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  // Only log renewals (not the very first invoice — that's covered by subscription_created)
  if (invoice.billing_reason !== "subscription_cycle") return;

  const { data: sub } = await getSupabase()
    .from("subscriptions")
    .select("user_id, stripe_customer_id, price_id, tier, environment")
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .maybeSingle();
  if (!sub?.user_id) return;

  const meta = {
    environment: env,
    stripe_subscription_id: subId,
    stripe_customer_id: sub.stripe_customer_id,
    invoice_id: invoice.id,
    lovable_price_id: sub.price_id,
    tier: sub.tier,
    amount_paid: invoice.amount_paid ?? null,
    currency: invoice.currency ?? null,
  };

  await logBilling(
    sub.user_id as string,
    "subscription_renewed",
    invoice.amount_paid ?? null,
    invoice.currency ?? null,
    meta,
  );
  await logBillingAudit(sub.user_id as string, "subscription_renewed", meta);
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  const { data: sub } = await getSupabase()
    .from("subscriptions")
    .select("user_id, stripe_customer_id, price_id, tier")
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .maybeSingle();
  if (!sub?.user_id) return;

  const meta = {
    environment: env,
    stripe_subscription_id: subId,
    stripe_customer_id: sub.stripe_customer_id,
    invoice_id: invoice.id,
    lovable_price_id: sub.price_id,
    tier: sub.tier,
    amount_due: invoice.amount_due ?? null,
    currency: invoice.currency ?? null,
    attempt_count: invoice.attempt_count ?? null,
    next_payment_attempt: tsToIso(invoice.next_payment_attempt),
  };

  await logBilling(
    sub.user_id as string,
    "failed_payment",
    invoice.amount_due ?? null,
    invoice.currency ?? null,
    meta,
  );
  await logBillingAudit(sub.user_id as string, "payment_failed", meta);
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
