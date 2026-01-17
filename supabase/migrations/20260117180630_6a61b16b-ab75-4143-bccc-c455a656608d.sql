-- Create junction table for many-to-many relationship between phases and project types
CREATE TABLE public.phase_template_project_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_template_id UUID NOT NULL REFERENCES public.phase_templates(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(phase_template_id, project_type)
);

-- Enable RLS
ALTER TABLE public.phase_template_project_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view phase template project types in their workspace"
ON public.phase_template_project_types
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert phase template project types in their workspace"
ON public.phase_template_project_types
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update phase template project types in their workspace"
ON public.phase_template_project_types
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete phase template project types in their workspace"
ON public.phase_template_project_types
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Migrate existing data: create junction records for each existing phase_template
INSERT INTO public.phase_template_project_types (phase_template_id, project_type, workspace_id, sort_order)
SELECT id, project_type, workspace_id, sort_order
FROM public.phase_templates
WHERE project_type IS NOT NULL;

-- Make project_type nullable in phase_templates (we keep it for backward compatibility during transition)
ALTER TABLE public.phase_templates ALTER COLUMN project_type DROP NOT NULL;

-- Add index for performance
CREATE INDEX idx_phase_template_project_types_project_type 
ON public.phase_template_project_types(workspace_id, project_type);

CREATE INDEX idx_phase_template_project_types_phase 
ON public.phase_template_project_types(phase_template_id);