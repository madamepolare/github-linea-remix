-- Drop existing policies on contacts
DROP POLICY IF EXISTS "Workspace members can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Workspace members can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Workspace members can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Workspace members can delete contacts" ON public.contacts;

-- Create a function to check if user can view sensitive contact data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_contacts(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Policy: All workspace members can view basic contact info (name, role, company)
-- But only admins/owners see email and phone via the function check in the app
CREATE POLICY "Workspace members can view contacts"
ON public.contacts
FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

-- Policy: Only admins and owners can create contacts
CREATE POLICY "Admins can create contacts"
ON public.contacts
FOR INSERT
WITH CHECK (
  can_view_sensitive_contacts(workspace_id, auth.uid())
);

-- Policy: Only admins and owners can update contacts
CREATE POLICY "Admins can update contacts"
ON public.contacts
FOR UPDATE
USING (can_view_sensitive_contacts(workspace_id, auth.uid()));

-- Policy: Only admins and owners can delete contacts
CREATE POLICY "Admins can delete contacts"
ON public.contacts
FOR DELETE
USING (can_view_sensitive_contacts(workspace_id, auth.uid()));