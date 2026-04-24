-- Helper: has the user completed onboarding? (staff always pass)
CREATE OR REPLACE FUNCTION public.has_completed_onboarding(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_staff(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND onboarding_completed = true
    )
$$;

-- ============================================================
-- Tighten existing policies on app feature tables.
-- Pattern: drop then recreate with an added onboarding check.
-- Staff bypass is preserved (is_staff is part of has_completed_onboarding).
-- ============================================================

-- messages ----------------------------------------------------
DROP POLICY IF EXISTS "message participants read" ON public.messages;
CREATE POLICY "message participants read"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    public.has_completed_onboarding(auth.uid())
    AND (
      sender_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = messages.thread_id
          AND (t.user_a = auth.uid() OR t.user_b = auth.uid())
      )
      OR public.is_staff(auth.uid())
    )
  );

DROP POLICY IF EXISTS "send own messages" ON public.messages;
CREATE POLICY "send own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.has_completed_onboarding(auth.uid())
  );

-- chat_threads ------------------------------------------------
DROP POLICY IF EXISTS "thread participants" ON public.chat_threads;
CREATE POLICY "thread participants"
  ON public.chat_threads FOR SELECT
  TO authenticated
  USING (
    public.has_completed_onboarding(auth.uid())
    AND (user_a = auth.uid() OR user_b = auth.uid() OR public.is_staff(auth.uid()))
  );

-- photos ------------------------------------------------------
DROP POLICY IF EXISTS "approved public photos visible" ON public.photos;
CREATE POLICY "approved public photos visible"
  ON public.photos FOR SELECT
  TO authenticated
  USING (
    public.has_completed_onboarding(auth.uid())
    AND moderation_status = 'approved'::public.moderation_status
    AND photo_type = ANY (ARRAY['primary'::public.photo_type, 'public'::public.photo_type])
  );

DROP POLICY IF EXISTS "own photos all" ON public.photos;
CREATE POLICY "own photos all"
  ON public.photos FOR ALL
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  )
  WITH CHECK (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- favorites ---------------------------------------------------
DROP POLICY IF EXISTS "own favorites" ON public.favorites;
CREATE POLICY "own favorites"
  ON public.favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()));

-- blocks ------------------------------------------------------
DROP POLICY IF EXISTS "own blocks" ON public.blocks;
CREATE POLICY "own blocks"
  ON public.blocks FOR ALL
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() AND public.has_completed_onboarding(auth.uid())
  );

-- reports -----------------------------------------------------
DROP POLICY IF EXISTS "create own reports" ON public.reports;
CREATE POLICY "create own reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid() AND public.has_completed_onboarding(auth.uid())
  );

DROP POLICY IF EXISTS "see own reports" ON public.reports;
CREATE POLICY "see own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    (reporter_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- gifts (catalog browse) --------------------------------------
DROP POLICY IF EXISTS "active gifts visible" ON public.gifts;
CREATE POLICY "active gifts visible"
  ON public.gifts FOR SELECT
  TO authenticated
  USING (
    active = true
    AND public.has_completed_onboarding(auth.uid())
  );

-- private_photo_permissions -----------------------------------
DROP POLICY IF EXISTS "grantee sees perms" ON public.private_photo_permissions;
CREATE POLICY "grantee sees perms"
  ON public.private_photo_permissions FOR SELECT
  TO authenticated
  USING (
    granted_to = auth.uid() AND public.has_completed_onboarding(auth.uid())
  );

DROP POLICY IF EXISTS "owner manages perms" ON public.private_photo_permissions;
CREATE POLICY "owner manages perms"
  ON public.private_photo_permissions FOR ALL
  TO authenticated
  USING (
    (owner_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  )
  WITH CHECK (
    owner_id = auth.uid() AND public.has_completed_onboarding(auth.uid())
  );

-- credit_wallets ----------------------------------------------
DROP POLICY IF EXISTS "own wallet" ON public.credit_wallets;
CREATE POLICY "own wallet"
  ON public.credit_wallets FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- credit_transactions -----------------------------------------
DROP POLICY IF EXISTS "own credit tx" ON public.credit_transactions;
CREATE POLICY "own credit tx"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.credit_wallets w
        WHERE w.id = credit_transactions.wallet_id AND w.user_id = auth.uid()
      )
      AND public.has_completed_onboarding(auth.uid())
    )
    OR public.is_staff(auth.uid())
  );

-- billing_events ----------------------------------------------
DROP POLICY IF EXISTS "own billing" ON public.billing_events;
CREATE POLICY "own billing"
  ON public.billing_events FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- subscriptions -----------------------------------------------
DROP POLICY IF EXISTS "own sub" ON public.subscriptions;
CREATE POLICY "own sub"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- verification_requests ---------------------------------------
DROP POLICY IF EXISTS "create own verification" ON public.verification_requests;
CREATE POLICY "create own verification"
  ON public.verification_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.has_completed_onboarding(auth.uid())
  );

DROP POLICY IF EXISTS "own verification" ON public.verification_requests;
CREATE POLICY "own verification"
  ON public.verification_requests FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- profile_scores ----------------------------------------------
DROP POLICY IF EXISTS "own score" ON public.profile_scores;
CREATE POLICY "own score"
  ON public.profile_scores FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid() AND public.has_completed_onboarding(auth.uid()))
    OR public.is_staff(auth.uid())
  );

-- audit_events ------------------------------------------------
-- Keep: users can still see their own auth/policy audit rows during onboarding
-- (needed so the policy reaccept flow can write/read its own audit entries
-- without surprise denials). Staff still see all.
DROP POLICY IF EXISTS "staff view audit" ON public.audit_events;
CREATE POLICY "staff view audit"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR subject_id = auth.uid()
    OR actor_id = auth.uid()
  );