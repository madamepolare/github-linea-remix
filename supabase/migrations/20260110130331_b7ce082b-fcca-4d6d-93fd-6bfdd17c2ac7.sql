-- Create skills table for discipline-based competencies
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'creative', 'technical', 'management'
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills
CREATE POLICY "Users can view skills in their workspace" 
ON public.skills FOR SELECT 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create skills in their workspace" 
ON public.skills FOR INSERT 
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update skills in their workspace" 
ON public.skills FOR UPDATE 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete skills in their workspace" 
ON public.skills FOR DELETE 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

-- Add discipline_id and skill_id to pricing_grids
ALTER TABLE public.pricing_grids 
ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS daily_rate NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

-- Add discipline_id and contract_type_id to quote_templates
ALTER TABLE public.quote_templates 
ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contract_type_id UUID REFERENCES public.contract_types(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- Add skill_id to commercial_document_phases
ALTER TABLE public.commercial_document_phases 
ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_workspace ON public.skills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skills_discipline ON public.skills(discipline_id);
CREATE INDEX IF NOT EXISTS idx_pricing_grids_skill ON public.pricing_grids(skill_id);
CREATE INDEX IF NOT EXISTS idx_pricing_grids_discipline ON public.pricing_grids(discipline_id);

-- Create trigger for skills updated_at
CREATE TRIGGER update_skills_updated_at
BEFORE UPDATE ON public.skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();