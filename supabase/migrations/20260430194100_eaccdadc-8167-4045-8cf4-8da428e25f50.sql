-- Enforce at most one live (active/trialing/past_due) subscription per user per environment
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user_env
  ON public.subscriptions (user_id, environment)
  WHERE status IN ('active', 'trialing', 'past_due');