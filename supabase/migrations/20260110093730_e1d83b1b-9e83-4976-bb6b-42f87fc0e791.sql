-- Create member_skills table to link team members with skills
CREATE TABLE public.member_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.workspace_settings(id) ON DELETE CASCADE,
  proficiency_level TEXT DEFAULT 'intermediate', -- junior, intermediate, senior, expert
  custom_daily_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view member skills in their workspace"
  ON public.member_skills FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage member skills in their workspace"
  ON public.member_skills FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_member_skills_updated_at
  BEFORE UPDATE ON public.member_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();