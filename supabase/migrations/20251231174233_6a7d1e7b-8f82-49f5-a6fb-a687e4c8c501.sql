DROP POLICY IF EXISTS "Creators can view their workspaces" ON public.workspaces;

-- Allow creators to read their just-created workspace (needed for INSERT ... RETURNING)
CREATE POLICY "Creators can view their workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (created_by = auth.uid());