-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own absence requests" ON public.team_absences;

-- Create new policy allowing users to create their own absences AND admins to create for others
CREATE POLICY "Users can create absences" ON public.team_absences FOR INSERT 
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  AND (
    -- Users can create their own absences
    auth.uid() = user_id 
    OR 
    -- Admins/owners can create absences for anyone in the workspace
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.user_id = auth.uid() 
      AND wm.workspace_id = team_absences.workspace_id
      AND wm.role IN ('owner', 'admin')
    )
  )
);