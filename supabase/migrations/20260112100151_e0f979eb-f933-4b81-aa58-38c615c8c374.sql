-- Add RLS policy for admins to update profiles of workspace members
CREATE POLICY "Admins can update profiles of workspace members"
ON public.profiles
FOR UPDATE
USING (
  user_id IN (
    SELECT wm.user_id 
    FROM public.workspace_members wm
    WHERE wm.workspace_id IN (
      SELECT wm2.workspace_id 
      FROM public.workspace_members wm2 
      WHERE wm2.user_id = auth.uid() 
      AND wm2.role IN ('owner', 'admin')
    )
  )
);