CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS TABLE(a_blocks_b boolean, b_blocks_a boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.blocks WHERE user_id = _a AND blocked_user_id = _b),
    EXISTS (SELECT 1 FROM public.blocks WHERE user_id = _b AND blocked_user_id = _a)
  WHERE _a = auth.uid() OR _b = auth.uid() OR public.is_staff(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;