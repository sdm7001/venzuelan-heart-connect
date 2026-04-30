-- Entitlements layer derived from subscriptions.
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  tier public.subscription_tier,
  status public.subscription_status NOT NULL DEFAULT 'inactive',
  is_active boolean NOT NULL DEFAULT false,
  monthly_contact_limit integer,
  contacts_used_this_period integer NOT NULL DEFAULT 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  source_subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user ON public.user_entitlements(user_id);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own entitlements read"
  ON public.user_entitlements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "staff manage entitlements"
  ON public.user_entitlements FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.contact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  period_start timestamptz NOT NULL,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipient_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_contact_events_user_period
  ON public.contact_events(user_id, period_start);

ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own contact events read"
  ON public.contact_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "staff manage contact events"
  ON public.contact_events FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

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
BEGIN
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

CREATE OR REPLACE FUNCTION public.consume_contact(_recipient_id uuid, _env text)
RETURNS TABLE(allowed boolean, reason text, contacts_used integer, monthly_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ent public.user_entitlements%ROWTYPE;
  v_inserted_count integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_ent
  FROM public.user_entitlements
  WHERE user_id = v_user AND environment = _env
  FOR UPDATE;

  IF NOT FOUND OR NOT v_ent.is_active THEN
    RETURN QUERY SELECT false, 'no_active_subscription'::text, 0, 0;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.contact_events
    WHERE user_id = v_user
      AND recipient_id = _recipient_id
      AND environment = _env
      AND period_start = v_ent.current_period_start
  ) THEN
    RETURN QUERY SELECT true, 'already_contacted'::text,
      v_ent.contacts_used_this_period, COALESCE(v_ent.monthly_contact_limit, -1);
    RETURN;
  END IF;

  IF v_ent.monthly_contact_limit IS NOT NULL
     AND v_ent.contacts_used_this_period >= v_ent.monthly_contact_limit THEN
    RETURN QUERY SELECT false, 'limit_reached'::text,
      v_ent.contacts_used_this_period, v_ent.monthly_contact_limit;
    RETURN;
  END IF;

  INSERT INTO public.contact_events
    (user_id, recipient_id, environment, period_start, period_end)
  VALUES
    (v_user, _recipient_id, _env, v_ent.current_period_start, v_ent.current_period_end)
  ON CONFLICT (user_id, recipient_id, period_start) DO NOTHING;
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count > 0 THEN
    UPDATE public.user_entitlements
    SET contacts_used_this_period = contacts_used_this_period + 1,
        updated_at = now()
    WHERE user_id = v_user AND environment = _env
    RETURNING * INTO v_ent;
  END IF;

  RETURN QUERY SELECT true, 'consumed'::text,
    v_ent.contacts_used_this_period, COALESCE(v_ent.monthly_contact_limit, -1);
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_entitlements;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

ALTER TABLE public.user_entitlements REPLICA IDENTITY FULL;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT user_id, environment FROM public.subscriptions LOOP
    PERFORM public.recompute_user_entitlement(r.user_id, r.environment);
  END LOOP;
END $$;