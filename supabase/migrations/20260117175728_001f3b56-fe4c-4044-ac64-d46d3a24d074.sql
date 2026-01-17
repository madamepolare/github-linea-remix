-- Create deliverable_templates table for storing deliverable definitions per phase template
CREATE TABLE IF NOT EXISTS public.deliverable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phase_template_id UUID NOT NULL REFERENCES public.phase_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT DEFAULT 'document', -- 'plan', '3d', 'document', 'presentation', 'model'
  estimated_hours NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_deliverable_templates_workspace ON public.deliverable_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_templates_phase ON public.deliverable_templates(phase_template_id);

-- Enable RLS
ALTER TABLE public.deliverable_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view deliverable templates in their workspace"
ON public.deliverable_templates FOR SELECT
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create deliverable templates in their workspace"
ON public.deliverable_templates FOR INSERT
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update deliverable templates in their workspace"
ON public.deliverable_templates FOR UPDATE
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete deliverable templates in their workspace"
ON public.deliverable_templates FOR DELETE
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

-- Add phase_id to tasks table if not exists
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON public.tasks(phase_id);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_deliverable_templates_updated_at
BEFORE UPDATE ON public.deliverable_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing deliverables from phase_templates to deliverable_templates
-- This inserts deliverable records from the JSONB array in phase_templates
INSERT INTO public.deliverable_templates (workspace_id, phase_template_id, name, sort_order)
SELECT 
  pt.workspace_id,
  pt.id as phase_template_id,
  jsonb_array_elements_text(pt.deliverables) as name,
  row_number() OVER (PARTITION BY pt.id ORDER BY ordinality) - 1 as sort_order
FROM public.phase_templates pt,
LATERAL jsonb_array_elements_text(pt.deliverables) WITH ORDINALITY
WHERE pt.deliverables IS NOT NULL 
  AND jsonb_array_length(pt.deliverables) > 0
ON CONFLICT DO NOTHING;