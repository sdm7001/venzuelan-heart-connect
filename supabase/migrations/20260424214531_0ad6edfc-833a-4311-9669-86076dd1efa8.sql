-- ============================================================
-- Staff MFA challenges (email OTP)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_mfa_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 10,
  consumed_at timestamptz,
  locked_at timestamptz,
  request_ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_mfa_user_active
  ON public.staff_mfa_challenges (user_id, created_at DESC)
  WHERE consumed_at IS NULL AND locked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_mfa_expiry
  ON public.staff_mfa_challenges (expires_at);

ALTER TABLE public.staff_mfa_challenges ENABLE ROW LEVEL SECURITY;

-- RLS: read-only access. All writes go through SECURITY DEFINER functions below.
DROP POLICY IF EXISTS "own mfa challenges read" ON public.staff_mfa_challenges;
CREATE POLICY "own mfa challenges read"
  ON public.staff_mfa_challenges
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- Updated_at trigger (reuse existing helper)
DROP TRIGGER IF EXISTS trg_staff_mfa_updated_at ON public.staff_mfa_challenges;
CREATE TRIGGER trg_staff_mfa_updated_at
  BEFORE UPDATE ON public.staff_mfa_challenges
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Allow 'otp' as a step-up method (staff_step_up.method is plain text,
-- so nothing to alter; we just document the contract here).
COMMENT ON COLUMN public.staff_step_up.method IS 'Step-up method: password | otp';

-- ============================================================
-- Issue a new challenge
-- ============================================================
CREATE OR REPLACE FUNCTION public.issue_staff_mfa_challenge(
  _code_hash text,
  _ip text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS TABLE(challenge_id uuid, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_recent_count int;
  v_id uuid;
  v_expires timestamptz := now() + interval '10 minutes';
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_staff(v_user) THEN
    RAISE EXCEPTION 'Staff role required' USING ERRCODE = '42501';
  END IF;

  -- Rate limit: max 5 issued in last 15 minutes
  SELECT count(*) INTO v_recent_count
  FROM public.staff_mfa_challenges
  WHERE user_id = v_user
    AND created_at > now() - interval '15 minutes';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many code requests. Try again in a few minutes.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Invalidate any previous unused/unlocked codes for this user
  UPDATE public.staff_mfa_challenges
  SET locked_at = now()
  WHERE user_id = v_user
    AND consumed_at IS NULL
    AND locked_at IS NULL;

  INSERT INTO public.staff_mfa_challenges
    (user_id, code_hash, expires_at, request_ip, user_agent)
  VALUES
    (v_user, _code_hash, v_expires, _ip, _user_agent)
  RETURNING id INTO v_id;

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (v_user, v_user, 'auth', 'staff_otp_issued',
          jsonb_build_object('challenge_id', v_id, 'ip', _ip));

  RETURN QUERY SELECT v_id, v_expires;
END
$$;

REVOKE ALL ON FUNCTION public.issue_staff_mfa_challenge(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_staff_mfa_challenge(text, text, text) TO authenticated;

-- ============================================================
-- Verify a challenge (called by edge function after bcrypt-comparing
-- the user-entered code against the stored hash). The edge function
-- passes the same hash it stored; this function only does the
-- bookkeeping (expiry, attempts, lock, consume, step-up upsert).
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_staff_mfa_challenge(
  _code_hash text
)
RETURNS TABLE(verified boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.staff_mfa_challenges%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_staff(v_user) THEN
    RAISE EXCEPTION 'Staff role required' USING ERRCODE = '42501';
  END IF;

  -- Latest active challenge for this user
  SELECT * INTO v_row
  FROM public.staff_mfa_challenges
  WHERE user_id = v_user
    AND consumed_at IS NULL
    AND locked_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
    VALUES (v_user, v_user, 'auth', 'staff_otp_failed',
            jsonb_build_object('reason', 'no_active_challenge'));
    RETURN QUERY SELECT false, 'no_active_challenge';
    RETURN;
  END IF;

  IF v_row.expires_at < now() THEN
    UPDATE public.staff_mfa_challenges
    SET locked_at = now()
    WHERE id = v_row.id;

    INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
    VALUES (v_user, v_user, 'auth', 'staff_otp_failed',
            jsonb_build_object('reason', 'expired', 'challenge_id', v_row.id));
    RETURN QUERY SELECT false, 'expired';
    RETURN;
  END IF;

  IF v_row.code_hash = _code_hash THEN
    UPDATE public.staff_mfa_challenges
    SET consumed_at = now(), attempts = attempts + 1
    WHERE id = v_row.id;

    INSERT INTO public.staff_step_up (user_id, method, verified_at, updated_at)
    VALUES (v_user, 'otp', now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET method = 'otp', verified_at = now(), updated_at = now();

    INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
    VALUES (v_user, v_user, 'auth', 'staff_otp_verified',
            jsonb_build_object('challenge_id', v_row.id));
    RETURN QUERY SELECT true, 'ok'::text;
    RETURN;
  END IF;

  -- Wrong code
  UPDATE public.staff_mfa_challenges
  SET attempts = attempts + 1,
      locked_at = CASE WHEN attempts + 1 >= max_attempts THEN now() ELSE NULL END
  WHERE id = v_row.id;

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (v_user, v_user, 'auth', 'staff_otp_failed',
          jsonb_build_object(
            'reason', 'bad_code',
            'challenge_id', v_row.id,
            'attempts', v_row.attempts + 1
          ));

  IF v_row.attempts + 1 >= v_row.max_attempts THEN
    RETURN QUERY SELECT false, 'locked';
  ELSE
    RETURN QUERY SELECT false, 'bad_code';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.verify_staff_mfa_challenge(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_staff_mfa_challenge(text) TO authenticated;