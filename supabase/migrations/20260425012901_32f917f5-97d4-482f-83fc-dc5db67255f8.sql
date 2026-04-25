-- 2. Setting flag (admins can flip to false to stop awarding)
INSERT INTO public.app_settings (key, value)
VALUES ('founding_member_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Update handle_new_user to award Founding Member when enabled
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_lang public.language_code;
  v_founding_enabled boolean;
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

  -- Auto-award Founding Member badge while enabled
  SELECT COALESCE((value)::boolean, false) INTO v_founding_enabled
  FROM public.app_settings WHERE key = 'founding_member_enabled';

  IF COALESCE(v_founding_enabled, false) THEN
    INSERT INTO public.trust_badges (user_id, kind, awarded_by, metadata)
    VALUES (NEW.id, 'founding_member'::public.trust_badge_kind, NULL,
            jsonb_build_object('source', 'auto_signup'))
    ON CONFLICT (user_id, kind) DO NOTHING;

    PERFORM public.recompute_trust_state(NEW.id);
  END IF;

  INSERT INTO public.audit_events (actor_id, subject_id, category, action, metadata)
  VALUES (NEW.id, NEW.id, 'auth', 'signup',
          jsonb_build_object('role', v_role, 'founding_member', COALESCE(v_founding_enabled, false)));

  RETURN NEW;
END $function$;

-- 4. Backfill for existing users
INSERT INTO public.trust_badges (user_id, kind, awarded_by, metadata)
SELECT p.id, 'founding_member'::public.trust_badge_kind, NULL,
       jsonb_build_object('source', 'backfill')
FROM public.profiles p
ON CONFLICT (user_id, kind) DO NOTHING;

-- 5. Recompute trust scores for everyone who got the backfill
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT user_id FROM public.trust_badges WHERE kind = 'founding_member' LOOP
    PERFORM public.recompute_trust_state(r.user_id);
  END LOOP;
END $$;
