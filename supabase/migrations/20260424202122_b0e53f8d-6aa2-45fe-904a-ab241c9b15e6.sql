
CREATE TYPE public.link_suggestion_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.internal_link_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  lang public.language_code NOT NULL,
  label text NOT NULL,
  href text NOT NULL,
  reason text,
  status public.link_suggestion_status NOT NULL DEFAULT 'pending',
  suggested_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ils_post ON public.internal_link_suggestions(post_id);
CREATE INDEX idx_ils_status ON public.internal_link_suggestions(status);

ALTER TABLE public.internal_link_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage link suggestions"
ON public.internal_link_suggestions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER set_updated_at_ils
BEFORE UPDATE ON public.internal_link_suggestions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
