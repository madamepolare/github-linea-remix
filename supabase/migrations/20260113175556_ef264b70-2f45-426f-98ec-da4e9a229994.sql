-- Drop existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback_entries;

-- Create new policy allowing workspace members to update any feedback
CREATE POLICY "Users can update feedback in their workspace"
ON public.feedback_entries
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Also update DELETE policy to allow workspace members to delete any feedback
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback_entries;

CREATE POLICY "Users can delete feedback in their workspace"
ON public.feedback_entries
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);