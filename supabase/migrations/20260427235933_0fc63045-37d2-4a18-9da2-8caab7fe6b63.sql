-- Temporary helper: SECURITY DEFINER function to apply blog post UPDATEs from server-side files.
-- Allows the project sandbox (which has SELECT/INSERT only via psql) to update blog_posts
-- by executing dynamic UPDATE statements supplied as text. Restricted to admins.
CREATE OR REPLACE FUNCTION public.admin_exec_blog_update(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hard guard: only allow statements that update blog_posts.
  IF _sql !~* '^\s*UPDATE\s+(public\.)?blog_posts\s+SET' THEN
    RAISE EXCEPTION 'Only UPDATE blog_posts statements are allowed';
  END IF;
  EXECUTE _sql;
END;
$$;

-- Lock down: only admins can call it.
REVOKE ALL ON FUNCTION public.admin_exec_blog_update(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exec_blog_update(text) TO authenticated;

-- RLS-style guard inside the function complement: also wrap with role check.
CREATE OR REPLACE FUNCTION public.admin_exec_blog_update(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;
  IF _sql !~* '^\s*UPDATE\s+(public\.)?blog_posts\s+SET' THEN
    RAISE EXCEPTION 'Only UPDATE blog_posts statements are allowed';
  END IF;
  EXECUTE _sql;
END;
$$;