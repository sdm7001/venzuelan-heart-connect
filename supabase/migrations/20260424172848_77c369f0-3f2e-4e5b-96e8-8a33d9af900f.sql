-- 1) Allow users to record their own policy/auth events (re-acceptance), and
--    allow staff to record events about any user (e.g. reminders sent by admins).
--    Without these INSERT policies the prior client-side audit_events.insert()
--    calls were silently failing under RLS.

CREATE POLICY "users insert own policy events"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND subject_id = auth.uid()
  AND category IN ('policy', 'auth')
);

CREATE POLICY "staff insert moderation audit"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  is_staff(auth.uid())
  AND actor_id = auth.uid()
);

-- 2) Per-user reminder records — drives the in-app reminder banner. Each row
--    represents one admin-initiated nudge for a specific policy_version. We
--    keep this separate from audit_events so the user's RLS read is simple
--    (their own rows only) and we can cheaply mark them dismissed.

CREATE TABLE public.policy_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sent_by uuid NOT NULL,
  policy_version text NOT NULL,
  missing_keys text[] NOT NULL DEFAULT '{}',
  channel text NOT NULL DEFAULT 'in_app',  -- 'in_app' | 'email' | 'in_app+email'
  email_status text,                        -- null until we wire up email sending
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dismissed_at timestamp with time zone
);

CREATE INDEX policy_reminders_user_idx
  ON public.policy_reminders (user_id, created_at DESC);

ALTER TABLE public.policy_reminders ENABLE ROW LEVEL SECURITY;

-- Recipient can read and dismiss their own reminders.
CREATE POLICY "own reminders read"
ON public.policy_reminders
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY "own reminders dismiss"
ON public.policy_reminders
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Staff create reminders.
CREATE POLICY "staff create reminders"
ON public.policy_reminders
FOR INSERT TO authenticated
WITH CHECK (is_staff(auth.uid()) AND sent_by = auth.uid());

CREATE POLICY "staff manage reminders"
ON public.policy_reminders
FOR ALL TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));