-- =========================================================================
-- P2 Milestone 1: Concierge Verified + Trust Badges + Verification Docs
-- =========================================================================

-- 1. Extend verification types -------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.verification_kind AS ENUM (
    'social_verification',
    'photo_verification',
    'id_verification',
    'income_verification',
    'concierge_verified_review'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add fields to verification_requests for the multi-type system.
-- We keep the existing `type` column intact for back-compat; the new `kind`
-- column is the canonical P2 field.
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS kind public.verification_kind,
  ADD COLUMN IF NOT EXISTS step text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewer_decision text,
  ADD COLUMN IF NOT EXISTS retry_of uuid REFERENCES public.verification_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_verif_user_kind ON public.verification_requests(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_verif_status_kind ON public.verification_requests(status, kind);

-- 2. Trust badge state -------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.trust_badge_kind AS ENUM (
    'email_confirmed',
    'photo_verified',
    'social_verified',
    'id_verified',
    'income_verified',
    'concierge_verified',
    'profile_complete'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.trust_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.trust_badge_kind NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by uuid,
  source_verification_id uuid REFERENCES public.verification_requests(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  revoked_at timestamptz,
  revoked_reason text,
  UNIQUE (user_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_trust_badges_user ON public.trust_badges(user_id) WHERE revoked_at IS NULL;

ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone read active badges" ON public.trust_badges;
CREATE POLICY "anyone read active badges" ON public.trust_badges
  FOR SELECT TO authenticated
  USING (revoked_at IS NULL OR is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff manage badges" ON public.trust_badges;
CREATE POLICY "staff manage badges" ON public.trust_badges
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- 3. Profile score extensions ------------------------------------------------
ALTER TABLE public.profile_scores
  ADD COLUMN IF NOT EXISTS concierge_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_priority_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_badge_count integer NOT NULL DEFAULT 0;

-- 4. Private storage bucket for verification documents -----------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Owner can upload/read their own docs; staff can read all.
-- Folder convention: {user_id}/{verification_id}/{filename}
DROP POLICY IF EXISTS "verif owner read" ON storage.objects;
CREATE POLICY "verif owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_staff(auth.uid()))
  );

DROP POLICY IF EXISTS "verif owner upload" ON storage.objects;
CREATE POLICY "verif owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "verif owner delete" ON storage.objects;
CREATE POLICY "verif owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_staff(auth.uid()))
  );

-- 5. Helper function: recompute trust state for a user ------------------------
CREATE OR REPLACE FUNCTION public.recompute_trust_state(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_concierge boolean;
  v_priority integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.trust_badges
  WHERE user_id = _user_id AND revoked_at IS NULL;

  SELECT EXISTS(
    SELECT 1 FROM public.trust_badges
    WHERE user_id = _user_id
      AND kind = 'concierge_verified'
      AND revoked_at IS NULL
  ) INTO v_concierge;

  v_priority := v_count * 10 + (CASE WHEN v_concierge THEN 50 ELSE 0 END);

  UPDATE public.profile_scores
  SET trust_badge_count = v_count,
      concierge_verified = v_concierge,
      verified_priority_score = v_priority,
      updated_at = now()
  WHERE user_id = _user_id;
END $$;

-- 6. Trigger: keep profile_scores in sync when badges change -----------------
CREATE OR REPLACE FUNCTION public.tg_trust_badge_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_trust_state(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trust_badges_after_change ON public.trust_badges;
CREATE TRIGGER trust_badges_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.trust_badges
  FOR EACH ROW EXECUTE FUNCTION public.tg_trust_badge_changed();

-- 7. updated_at trigger on verification_requests if not already present
DROP TRIGGER IF EXISTS verif_set_updated_at ON public.verification_requests;
CREATE TRIGGER verif_set_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();