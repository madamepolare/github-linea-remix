-- Create a function that can fetch invite details by token (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(invite_token uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  expires_at timestamptz,
  workspace_id uuid,
  workspace_name text,
  workspace_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wi.id,
    wi.email,
    wi.role::text,
    wi.expires_at,
    w.id as workspace_id,
    w.name as workspace_name,
    w.slug as workspace_slug
  FROM public.workspace_invites wi
  JOIN public.workspaces w ON w.id = wi.workspace_id
  WHERE wi.token = invite_token
    AND wi.expires_at > NOW();
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO authenticated;