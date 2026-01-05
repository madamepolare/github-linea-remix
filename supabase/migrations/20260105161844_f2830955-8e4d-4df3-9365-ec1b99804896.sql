-- Add sub_row_names to store names for each sub-row (stored as JSON in lot)
ALTER TABLE public.project_lots ADD COLUMN IF NOT EXISTS sub_row_names jsonb DEFAULT '{}';

-- Create planning versions table for history
CREATE TABLE IF NOT EXISTS public.project_planning_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  description text,
  snapshot jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_planning_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies using workspace_members
CREATE POLICY "Users can view planning versions in their workspace"
ON public.project_planning_versions
FOR SELECT
USING (workspace_id IN (
  SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
));

CREATE POLICY "Users can create planning versions in their workspace"
ON public.project_planning_versions
FOR INSERT
WITH CHECK (workspace_id IN (
  SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
));

CREATE POLICY "Users can delete planning versions in their workspace"
ON public.project_planning_versions
FOR DELETE
USING (workspace_id IN (
  SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
));

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_planning_versions_project ON public.project_planning_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_planning_versions_created ON public.project_planning_versions(created_at DESC);