
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('female_user','male_user','moderator','admin','support','verification_reviewer');
CREATE TYPE public.gender AS ENUM ('female','male','other');
CREATE TYPE public.relationship_intention AS ENUM ('marriage','serious_relationship','travel_and_meet','friendship_first');
CREATE TYPE public.language_code AS ENUM ('en','es');
CREATE TYPE public.account_status AS ENUM ('active','restricted','suspended','banned','pending_verification');
CREATE TYPE public.photo_type AS ENUM ('primary','public','private');
CREATE TYPE public.moderation_status AS ENUM ('pending','approved','rejected','flagged');
CREATE TYPE public.report_category AS ENUM ('scam_or_fraud','impersonation','solicitation','explicit_content','harassment','underage_concern','spam','off_platform_payment_request','other');
CREATE TYPE public.report_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.report_status AS ENUM ('new','in_review','escalated','actioned','closed');
CREATE TYPE public.report_target AS ENUM ('profile','photo','message','account');
CREATE TYPE public.flag_kind AS ENUM ('mass_messaging','copy_paste_intro','rapid_contact','off_platform_attempt','money_request','high_report_frequency','text_moderation','image_moderation');
CREATE TYPE public.moderator_action AS ENUM ('warn_user','remove_content','reject_photo','restrict_features','suspend_account','ban_account','add_note','escalate','close_case');
CREATE TYPE public.verification_type AS ENUM ('social_verification','photo_verification','id_verification','income_verification','background_check_placeholder','concierge_verified_review');
CREATE TYPE public.verification_status AS ENUM ('not_started','submitted','under_review','approved','rejected','needs_more_info');
CREATE TYPE public.subscription_tier AS ENUM ('level_1','level_2','premium','concierge_verified');
CREATE TYPE public.subscription_status AS ENUM ('inactive','active','past_due','canceled','refunded');
CREATE TYPE public.billing_event_type AS ENUM ('subscription_created','subscription_renewed','subscription_canceled','credit_purchase','refund','failed_payment');

-- =========================================================
-- USER ROLES (separate table - never on profiles)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role checker (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('admin','moderator','support','verification_reviewer'))
$$;

CREATE POLICY "users see their own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "only admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  gender public.gender,
  date_of_birth DATE,
  country TEXT,
  city TEXT,
  bio TEXT,
  relationship_intention public.relationship_intention,
  preferred_language public.language_code NOT NULL DEFAULT 'en',
  spoken_languages TEXT[] DEFAULT '{}',
  account_status public.account_status NOT NULL DEFAULT 'active',
  age_confirmed BOOLEAN NOT NULL DEFAULT false,
  community_rules_accepted_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()) OR account_status = 'active');
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "staff manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- PHOTOS
-- =========================================================
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  photo_type public.photo_type NOT NULL DEFAULT 'public',
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own photos all" ON public.photos FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "approved public photos visible" ON public.photos FOR SELECT TO authenticated
  USING (moderation_status='approved' AND photo_type IN ('primary','public'));

-- =========================================================
-- PRIVATE PHOTO PERMISSIONS
-- =========================================================
CREATE TABLE public.private_photo_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, granted_to)
);
ALTER TABLE public.private_photo_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages perms" ON public.private_photo_permissions FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "grantee sees perms" ON public.private_photo_permissions FOR SELECT TO authenticated
  USING (granted_to = auth.uid());

-- =========================================================
-- FAVORITES & BLOCKS
-- =========================================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, favorited_user_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own blocks" ON public.blocks FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid());

-- =========================================================
-- CHAT (placeholder structure)
-- =========================================================
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thread participants" ON public.chat_threads FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message participants read" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id
    AND (t.user_a = auth.uid() OR t.user_b = auth.uid())
  ) OR public.is_staff(auth.uid()));
CREATE POLICY "send own messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- =========================================================
-- REPORTS
-- =========================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target public.report_target NOT NULL,
  target_id UUID,
  category public.report_category NOT NULL,
  severity public.report_severity NOT NULL DEFAULT 'medium',
  status public.report_status NOT NULL DEFAULT 'new',
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "create own reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "see own reports" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- MODERATION FLAGS & ACTIONS
-- =========================================================
CREATE TABLE public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.flag_kind NOT NULL,
  severity public.report_severity NOT NULL DEFAULT 'low',
  status public.report_status NOT NULL DEFAULT 'new',
  context JSONB DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff only flags" ON public.moderation_flags FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  flag_id UUID REFERENCES public.moderation_flags(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action public.moderator_action NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff only actions" ON public.moderation_actions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- VERIFICATION
-- =========================================================
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.verification_type NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'not_started',
  evidence_url TEXT,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own verification" ON public.verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "create own verification" ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff review verification" ON public.verification_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- BILLING
-- =========================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage subs" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet" ON public.credit_wallets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.credit_wallets(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own credit tx" ON public.credit_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.credit_wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
    OR public.is_staff(auth.uid()));

CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credit_cost INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active gifts visible" ON public.gifts FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "staff manage gifts" ON public.gifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type public.billing_event_type NOT NULL,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own billing" ON public.billing_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- =========================================================
-- PROFILE SCORES
-- =========================================================
CREATE TABLE public.profile_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completeness INTEGER NOT NULL DEFAULT 0,
  trust_score INTEGER NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own score" ON public.profile_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- =========================================================
-- AUDIT EVENTS & POLICY ACK
-- =========================================================
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view audit" ON public.audit_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR subject_id = auth.uid() OR actor_id = auth.uid());

CREATE TABLE public.policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, policy_key, policy_version)
);
ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ack write" ON public.policy_acknowledgements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own ack read" ON public.policy_acknowledgements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- =========================================================
-- TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_verif_updated BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile + role + wallet + score on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
  v_lang public.language_code;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'account_type')::public.app_role, 'male_user');
  v_lang := COALESCE((NEW.raw_user_meta_data->>'preferred_language')::public.language_code, 'en');

  INSERT INTO public.profiles (id, display_name, preferred_language, gender, age_confirmed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    v_lang,
    CASE v_role WHEN 'female_user' THEN 'female'::public.gender
                WHEN 'male_user' THEN 'male'::public.gender
                ELSE NULL END,
    COALESCE((NEW.raw_user_meta_data->>'age_confirmed')::boolean, false)
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  INSERT INTO public.credit_wallets (user_id, balance) VALUES (NEW.id, 0);
  INSERT INTO public.profile_scores (user_id) VALUES (NEW.id);

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (NEW.id, NEW.id, 'auth', 'signup', jsonb_build_object('role', v_role));

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
