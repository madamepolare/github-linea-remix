-- Drop the restrictive delete policy
DROP POLICY IF EXISTS "Users can delete their own pending absence requests" ON public.team_absences;

-- Create a new policy that allows:
-- 1. Users to delete their own pending requests
-- 2. Admins/owners to delete any absence in their workspace
CREATE POLICY "Users can delete own pending or admins can delete any"
ON public.team_absences FOR DELETE
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR
  (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ))
);