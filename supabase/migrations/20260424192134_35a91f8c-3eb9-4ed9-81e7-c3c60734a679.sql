
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  reading_minutes integer NOT NULL DEFAULT 5,
  hero_image_url text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  tags text[] NOT NULL DEFAULT '{}',

  title_en text NOT NULL,
  meta_description_en text NOT NULL,
  excerpt_en text NOT NULL,
  body_en text NOT NULL,
  faq_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_links_en jsonb NOT NULL DEFAULT '[]'::jsonb,

  title_es text NOT NULL,
  meta_description_es text NOT NULL,
  excerpt_es text NOT NULL,
  body_es text NOT NULL,
  faq_es jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_links_es jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_published_at ON public.blog_posts (published, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts (category);
CREATE INDEX idx_blog_posts_featured ON public.blog_posts (featured) WHERE featured = true;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published posts are public"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (published = true);

CREATE POLICY "admins manage posts"
ON public.blog_posts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER blog_posts_set_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
