-- Add new subscription_status enum values
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'trialing';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'incomplete';

-- Add new billing_event_type enum values
ALTER TYPE public.billing_event_type ADD VALUE IF NOT EXISTS 'subscription_upgraded';
ALTER TYPE public.billing_event_type ADD VALUE IF NOT EXISTS 'subscription_downgraded';

-- Extend subscriptions with Stripe price/product + environment + cancel_at_period_end
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- Helpful index for env-scoped lookups by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_env
  ON public.subscriptions(user_id, environment, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;