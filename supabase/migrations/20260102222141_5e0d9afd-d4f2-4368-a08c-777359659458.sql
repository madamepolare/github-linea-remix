-- Create phase_templates table for reusable phase definitions
CREATE TABLE public.phase_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL DEFAULT 'interior',
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_percentage NUMERIC DEFAULT 0,
  deliverables JSONB DEFAULT '[]'::jsonb,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint for code per workspace and project type
CREATE UNIQUE INDEX idx_phase_templates_unique ON public.phase_templates(workspace_id, project_type, code);

-- Enable RLS
ALTER TABLE public.phase_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Workspace members can view phase templates"
ON public.phase_templates FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create phase templates"
ON public.phase_templates FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update phase templates"
ON public.phase_templates FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete phase templates"
ON public.phase_templates FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));

-- Add missing columns to project_phases for full data transfer
ALTER TABLE public.project_phases 
ADD COLUMN IF NOT EXISTS phase_code TEXT,
ADD COLUMN IF NOT EXISTS percentage_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER update_phase_templates_updated_at
BEFORE UPDATE ON public.phase_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();