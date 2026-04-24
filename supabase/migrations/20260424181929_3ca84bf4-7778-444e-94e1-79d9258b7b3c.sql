
-- =========================================================================
-- P2 Foundation Slice for P3 dependencies
-- Trust eligibility helpers + verification linkage + gift order stubs
-- =========================================================================

-- 1. Trust eligibility helpers ----------------------------------------------

CREATE OR REPLACE FUNCTION public.has_active_badge(_user_id uuid, _kind public.trust_badge_kind)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trust_badges
    WHERE user_id = _user_id AND kind = _kind AND revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.user_trust_state(_user_id uuid)
RETURNS TABLE (
  badge_count integer,
  concierge_verified boolean,
  recent_severe_flags integer,
  account_status public.account_status
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.trust_badges
       WHERE user_id = _user_id AND revoked_at IS NULL),
    public.has_active_badge(_user_id, 'concierge_verified'),
    (SELECT count(*)::int FROM public.moderation_flags
       WHERE user_id = _user_id
         AND severity IN ('high','critical')
         AND created_at > now() - interval '30 days'),
    (SELECT account_status FROM public.profiles WHERE id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_eligible_for_gifting(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.profiles
            WHERE id = _user_id AND account_status = 'active')
    AND (SELECT count(*) FROM public.trust_badges
         WHERE user_id = _user_id AND revoked_at IS NULL) >= 1
    AND NOT EXISTS (
      SELECT 1 FROM public.moderation_flags
      WHERE user_id = _user_id
        AND severity IN ('high','critical')
        AND created_at > now() - interval '30 days'
    );
$$;

-- 2. Verification → trust badge bridge --------------------------------------

CREATE OR REPLACE FUNCTION public.award_badge_from_verification(_verification_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_kind public.verification_kind;
  v_status public.verification_status;
  v_badge public.trust_badge_kind;
  v_badge_id uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can award badges';
  END IF;

  SELECT user_id, kind, status
    INTO v_user, v_kind, v_status
  FROM public.verification_requests
  WHERE id = _verification_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Verification request % not found', _verification_id;
  END IF;
  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'Verification % is not approved (status=%)', _verification_id, v_status;
  END IF;
  IF v_kind IS NULL THEN
    RAISE EXCEPTION 'Verification % has no kind set', _verification_id;
  END IF;

  v_badge := CASE v_kind
    WHEN 'social_verification'        THEN 'social_verified'::public.trust_badge_kind
    WHEN 'photo_verification'         THEN 'photo_verified'::public.trust_badge_kind
    WHEN 'id_verification'            THEN 'id_verified'::public.trust_badge_kind
    WHEN 'income_verification'        THEN 'income_verified'::public.trust_badge_kind
    WHEN 'concierge_verified_review' THEN 'concierge_verified'::public.trust_badge_kind
  END;

  INSERT INTO public.trust_badges (user_id, kind, awarded_by, source_verification_id)
  VALUES (v_user, v_badge, auth.uid(), _verification_id)
  ON CONFLICT (user_id, kind) DO UPDATE
    SET revoked_at = NULL,
        revoked_reason = NULL,
        awarded_at = now(),
        awarded_by = auth.uid(),
        source_verification_id = _verification_id
  RETURNING id INTO v_badge_id;

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (auth.uid(), v_user, 'verification', 'badge_awarded',
          jsonb_build_object(
            'badge_kind', v_badge,
            'verification_id', _verification_id,
            'verification_kind', v_kind
          ));

  RETURN v_badge_id;
END $$;

-- 3. Gift order tables (shared by P2 virtual + P3 physical) -----------------

DO $$ BEGIN
  CREATE TYPE public.gift_order_kind AS ENUM ('virtual','physical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gift_order_status AS ENUM (
    'created',
    'paid',
    'blocked_by_moderation',
    'fulfilled',
    'refunded',
    'canceled',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.gift_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  gift_id uuid NOT NULL REFERENCES public.gifts(id) ON DELETE RESTRICT,
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE SET NULL,
  kind public.gift_order_kind NOT NULL,
  status public.gift_order_status NOT NULL DEFAULT 'created',
  credit_cost integer,
  amount_cents integer,
  currency text DEFAULT 'USD',
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_orders_sender    ON public.gift_orders(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_orders_recipient ON public.gift_orders(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_orders_status    ON public.gift_orders(status);

ALTER TABLE public.gift_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gift orders read participants" ON public.gift_orders;
CREATE POLICY "gift orders read participants" ON public.gift_orders
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR is_staff(auth.uid())
  );

DROP POLICY IF EXISTS "gift orders sender insert" ON public.gift_orders;
CREATE POLICY "gift orders sender insert" ON public.gift_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND has_completed_onboarding(auth.uid())
    AND public.is_eligible_for_gifting(auth.uid())
  );

DROP POLICY IF EXISTS "gift orders staff manage" ON public.gift_orders;
CREATE POLICY "gift orders staff manage" ON public.gift_orders
  FOR UPDATE TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

DROP TRIGGER IF EXISTS gift_orders_set_updated_at ON public.gift_orders;
CREATE TRIGGER gift_orders_set_updated_at
  BEFORE UPDATE ON public.gift_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Append-only status history
CREATE TABLE IF NOT EXISTS public.gift_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.gift_orders(id) ON DELETE CASCADE,
  status public.gift_order_status NOT NULL,
  actor_id uuid,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_order_events_order ON public.gift_order_events(order_id, created_at);

ALTER TABLE public.gift_order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gift order events read" ON public.gift_order_events;
CREATE POLICY "gift order events read" ON public.gift_order_events
  FOR SELECT TO authenticated
  USING (
    is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.gift_orders o
      WHERE o.id = gift_order_events.order_id
        AND (o.sender_id = auth.uid() OR o.recipient_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "gift order events staff insert" ON public.gift_order_events;
CREATE POLICY "gift order events staff insert" ON public.gift_order_events
  FOR INSERT TO authenticated
  WITH CHECK (is_staff(auth.uid()));

-- 4. Risk events stub (P3 fraud tooling will write here) --------------------

CREATE TABLE IF NOT EXISTS public.risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  severity public.report_severity NOT NULL DEFAULT 'low',
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_events_user ON public.risk_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_unreviewed ON public.risk_events(created_at DESC) WHERE reviewed_at IS NULL;

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk events staff only" ON public.risk_events;
CREATE POLICY "risk events staff only" ON public.risk_events
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- 5. Documentation: concierge_verified deprecated as a subscription tier ----
COMMENT ON TYPE public.subscription_tier IS
  'Subscription plans for male users. NOTE: the value ''concierge_verified'' is DEPRECATED here — Concierge Verified is awarded via trust_badges, not sold as a subscription tier. Kept for back-compat only; do not assign to new subscriptions.';
