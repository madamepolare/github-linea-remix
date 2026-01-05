-- Create table for tracking enabled modules per project
CREATE TABLE public.project_enabled_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  enabled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  enabled_by UUID,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  UNIQUE(project_id, module_key)
);

-- Enable RLS
ALTER TABLE public.project_enabled_modules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view modules for their workspace projects"
ON public.project_enabled_modules
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can enable modules for their workspace projects"
ON public.project_enabled_modules
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can disable modules for their workspace projects"
ON public.project_enabled_modules
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_project_enabled_modules_project ON public.project_enabled_modules(project_id);
CREATE INDEX idx_project_enabled_modules_workspace ON public.project_enabled_modules(workspace_id);