-- ============================================================
-- Staff MFA recovery codes (OTP fallback)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_recovery_user_hash
  ON public.staff_recovery_codes (user_id, code_hash);

CREATE INDEX IF NOT EXISTS idx_staff_recovery_user_active
  ON public.staff_recovery_codes (user_id)
  WHERE used_at IS NULL;

ALTER TABLE public.staff_recovery_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own recovery codes read" ON public.staff_recovery_codes;
CREATE POLICY "own recovery codes read"
  ON public.staff_recovery_codes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- Document the new method value
COMMENT ON COLUMN public.staff_step_up.method IS 'Step-up method: password | otp | recovery';

-- ============================================================
-- Generate (or replace) the user's set of recovery codes.
-- Caller passes pre-hashed codes (SHA-256 hex).
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_staff_recovery_codes(
  _code_hashes text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_inserted int := 0;
  v_hash text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_staff(v_user) THEN
    RAISE EXCEPTION 'Staff role required' USING ERRCODE = '42501';
  END IF;

  IF _code_hashes IS NULL OR array_length(_code_hashes, 1) IS NULL THEN
    RAISE EXCEPTION 'No codes provided' USING ERRCODE = '22023';
  END IF;

  IF array_length(_code_hashes, 1) > 10 THEN
    RAISE EXCEPTION 'At most 10 codes per generation' USING ERRCODE = '22023';
  END IF;

  -- Revoke any unused existing codes for this user
  DELETE FROM public.staff_recovery_codes
  WHERE user_id = v_user AND used_at IS NULL;

  FOREACH v_hash IN ARRAY _code_hashes LOOP
    IF v_hash IS NULL OR length(v_hash) < 32 THEN
      RAISE EXCEPTION 'Invalid code hash' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.staff_recovery_codes (user_id, code_hash)
    VALUES (v_user, v_hash)
    ON CONFLICT (user_id, code_hash) DO NOTHING;
    v_inserted := v_inserted + 1;
  END LOOP;

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (v_user, v_user, 'auth', 'staff_recovery_codes_generated',
          jsonb_build_object('count', v_inserted));

  RETURN v_inserted;
END
$$;

REVOKE ALL ON FUNCTION public.generate_staff_recovery_codes(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_staff_recovery_codes(text[]) TO authenticated;

-- ============================================================
-- Consume one recovery code. Caller must already have re-authed
-- their password client-side (Supabase signInWithPassword) right
-- before calling this — the frontend enforces that ordering.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_staff_recovery_code(
  _code_hash text
)
RETURNS TABLE(verified boolean, reason text, codes_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_remaining int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_staff(v_user) THEN
    RAISE EXCEPTION 'Staff role required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_id
  FROM public.staff_recovery_codes
  WHERE user_id = v_user
    AND code_hash = _code_hash
    AND used_at IS NULL
  LIMIT 1
  FOR UPDATE;

  IF v_id IS NULL THEN
    INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
    VALUES (v_user, v_user, 'auth', 'staff_fallback_failed',
            jsonb_build_object('reason', 'no_match'));
    RETURN QUERY SELECT false, 'no_match'::text, 0;
    RETURN;
  END IF;

  UPDATE public.staff_recovery_codes
  SET used_at = now()
  WHERE id = v_id;

  INSERT INTO public.staff_step_up (user_id, method, verified_at, updated_at)
  VALUES (v_user, 'recovery', now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET method = 'recovery', verified_at = now(), updated_at = now();

  SELECT count(*)::int INTO v_remaining
  FROM public.staff_recovery_codes
  WHERE user_id = v_user AND used_at IS NULL;

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (v_user, v_user, 'auth', 'staff_fallback_used',
          jsonb_build_object('codes_remaining', v_remaining));

  RETURN QUERY SELECT true, 'ok'::text, v_remaining;
END
$$;

REVOKE ALL ON FUNCTION public.consume_staff_recovery_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_staff_recovery_code(text) TO authenticated;

-- ============================================================
-- Quick count helper (UI uses this to warn when low)
-- ============================================================
CREATE OR REPLACE FUNCTION public.count_active_staff_recovery_codes()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int
  FROM public.staff_recovery_codes
  WHERE user_id = auth.uid() AND used_at IS NULL
$$;

REVOKE ALL ON FUNCTION public.count_active_staff_recovery_codes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_active_staff_recovery_codes() TO authenticated;