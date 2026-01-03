-- Sécuriser la table crm_emails avec des politiques RLS restrictives
-- Seuls les admins/owners ou le créateur peuvent voir les emails

-- Drop existing policies
DROP POLICY IF EXISTS "Workspace members can view emails" ON public.crm_emails;
DROP POLICY IF EXISTS "Workspace members can create emails" ON public.crm_emails;
DROP POLICY IF EXISTS "Workspace members can update emails" ON public.crm_emails;
DROP POLICY IF EXISTS "Workspace members can delete emails" ON public.crm_emails;

-- Create function to check if user can access emails (admin/owner or creator)
CREATE OR REPLACE FUNCTION public.can_access_emails(_workspace_id uuid, _user_id uuid, _created_by uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
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
$$;

-- Create new restrictive policies
-- SELECT: Only admin/owner or creator can view emails
CREATE POLICY "Admins and creators can view emails"
ON public.crm_emails
FOR SELECT
TO authenticated
USING (
  public.can_access_emails(workspace_id, auth.uid(), created_by)
);

-- INSERT: All workspace members can create emails
CREATE POLICY "Workspace members can create emails"
ON public.crm_emails
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, auth.uid())
);

-- UPDATE: Only admin/owner or creator can update
CREATE POLICY "Admins and creators can update emails"
ON public.crm_emails
FOR UPDATE
TO authenticated
USING (
  public.can_access_emails(workspace_id, auth.uid(), created_by)
);

-- DELETE: Only admin/owner or creator can delete
CREATE POLICY "Admins and creators can delete emails"
ON public.crm_emails
FOR DELETE
TO authenticated
USING (
  public.can_access_emails(workspace_id, auth.uid(), created_by)
);