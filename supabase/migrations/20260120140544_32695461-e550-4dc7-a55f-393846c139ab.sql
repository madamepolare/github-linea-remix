-- Update can_access_emails function to check active workspace
CREATE OR REPLACE FUNCTION public.can_access_emails(_workspace_id uuid, _user_id uuid, _created_by uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    -- Email must belong to user's active workspace
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _user_id
        AND p.active_workspace_id = _workspace_id
    )
    AND (
      -- User is the creator
      _user_id = _created_by
      OR
      -- User is admin or owner
      EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _workspace_id
          AND user_id = _user_id
          AND role IN ('owner', 'admin')
      )
      OR
      -- User is a member (can view)
      EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _workspace_id
          AND user_id = _user_id
      )
    )
$function$;