-- Trigger: never let a female_user have a paid subscription row
CREATE OR REPLACE FUNCTION public.tg_block_female_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('active','trialing','past_due','canceled')
     AND public.has_role(NEW.user_id, 'female_user'::public.app_role) THEN
    RAISE EXCEPTION 'Female users do not have paid subscriptions (user_id=%)', NEW.user_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS block_female_subscriptions ON public.subscriptions;
CREATE TRIGGER block_female_subscriptions
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_block_female_subscriptions();

-- Update recompute to always treat women as free (inactive entitlement, no contact cap)
CREATE OR REPLACE FUNCTION public.recompute_user_entitlement(_user_id uuid, _env text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.subscriptions%ROWTYPE;
  v_active boolean;
  v_limit integer;
  v_period_start timestamptz;
  v_used integer := 0;
  v_is_female boolean;
BEGIN
  v_is_female := public.has_role(_user_id, 'female_user'::public.app_role);

  IF v_is_female THEN
    INSERT INTO public.user_entitlements AS e (
      user_id, environment, tier, status, is_active,
      monthly_contact_limit, contacts_used_this_period,
      current_period_start, current_period_end, cancel_at_period_end,
      source_subscription_id, updated_at
    ) VALUES (
      _user_id, _env, NULL, 'inactive', false,
      NULL, 0, NULL, NULL, false, NULL, now()
    )
    ON CONFLICT (user_id, environment) DO UPDATE SET
      tier = NULL,
      status = 'inactive',
      is_active = false,
      monthly_contact_limit = NULL,
      contacts_used_this_period = 0,
      cancel_at_period_end = false,
      source_subscription_id = NULL,
      updated_at = now();
    RETURN;
  END IF;

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = _user_id AND environment = _env
  ORDER BY
    CASE WHEN status IN ('active','trialing','past_due') THEN 0
         WHEN status = 'canceled' AND current_period_end > now() THEN 1
         ELSE 2 END,
    created_at DESC
  LIMIT 1;

  v_active := v_sub.id IS NOT NULL AND (
    (v_sub.status IN ('active','trialing') AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()))
    OR (v_sub.status = 'past_due' AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()))
    OR (v_sub.status = 'canceled' AND v_sub.current_period_end > now())
  );

  v_limit := CASE
    WHEN NOT v_active THEN 0
    WHEN v_sub.tier = 'level_1' THEN 10
    WHEN v_sub.tier = 'level_2' THEN 30
    WHEN v_sub.tier IN ('premium','concierge_verified') THEN NULL
    ELSE 0
  END;

  v_period_start := COALESCE(v_sub.current_period_start, date_trunc('month', now()));

  SELECT count(*)::int INTO v_used
  FROM public.contact_events
  WHERE user_id = _user_id
    AND environment = _env
    AND period_start = v_period_start;

  INSERT INTO public.user_entitlements AS e (
    user_id, environment, tier, status, is_active,
    monthly_contact_limit, contacts_used_this_period,
    current_period_start, current_period_end, cancel_at_period_end,
    source_subscription_id, updated_at
  ) VALUES (
    _user_id, _env, v_sub.tier, COALESCE(v_sub.status, 'inactive'), v_active,
    v_limit, v_used,
    v_sub.current_period_start, v_sub.current_period_end,
    COALESCE(v_sub.cancel_at_period_end, false),
    v_sub.id, now()
  )
  ON CONFLICT (user_id, environment) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    monthly_contact_limit = EXCLUDED.monthly_contact_limit,
    contacts_used_this_period = EXCLUDED.contacts_used_this_period,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    source_subscription_id = EXCLUDED.source_subscription_id,
    updated_at = now();
END $$;