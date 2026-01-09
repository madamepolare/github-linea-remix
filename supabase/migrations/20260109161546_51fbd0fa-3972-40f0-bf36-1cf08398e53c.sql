-- Add is_hidden column to workspace_members for hidden access
ALTER TABLE public.workspace_members 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.workspace_members.is_hidden IS 'When true, member has access but is not shown in team lists';