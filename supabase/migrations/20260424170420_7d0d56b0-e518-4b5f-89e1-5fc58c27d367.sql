-- App settings: admin-managed key/value config (policy version + legal URLs)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public/auth read: anyone authenticated can read settings (URLs and version are non-sensitive)
CREATE POLICY "anyone read settings"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "admins insert settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete settings"
  ON public.app_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- History table for audit (admin-readable, insert via app code)
CREATE TABLE public.app_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read settings history"
  ON public.app_settings_history FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "admins insert settings history"
  ON public.app_settings_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed initial policy_config singleton with current values
INSERT INTO public.app_settings (key, value)
VALUES (
  'policy_config',
  jsonb_build_object(
    'policy_version', '2025-01-01',
    'urls', jsonb_build_object(
      'tos', '/legal/terms',
      'privacy', '/legal/privacy',
      'aup', '/legal/acceptable-use',
      'anti_solicitation', '/legal/anti-solicitation'
    )
  )
);