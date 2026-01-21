-- Allow workspace admins/owners to create time entries for any workspace member
DROP POLICY IF EXISTS "Users can create their own time entries" ON public.team_time_entries;

CREATE POLICY "Users can create time entries"
ON public.team_time_entries
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
  AND (
    -- User can create for themselves
    auth.uid() = user_id
    OR
    -- Admins/owners can create for any member in workspace
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
      AND wm.workspace_id = team_time_entries.workspace_id
      AND wm.role IN ('owner', 'admin')
    )
  )
);