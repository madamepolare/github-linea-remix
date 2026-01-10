-- Add apprentice/alternant role to workspace members
-- This allows planning all future absences for interns

-- Create table for apprentice schedule (school/company planning)
CREATE TABLE IF NOT EXISTS public.apprentice_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Schedule pattern
  schedule_name TEXT NOT NULL DEFAULT 'Planning alternance',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Pattern definition (e.g., "2 weeks company, 1 week school")
  pattern_type TEXT NOT NULL DEFAULT 'weekly', -- weekly, biweekly, monthly, custom
  company_days_per_week INTEGER DEFAULT 3,
  school_days_per_week INTEGER DEFAULT 2,
  
  -- Custom pattern JSON for complex schedules
  custom_pattern JSONB,
  
  -- PDF document reference
  pdf_url TEXT,
  pdf_filename TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.apprentice_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view apprentice schedules in their workspace"
ON public.apprentice_schedules
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage apprentice schedules"
ON public.apprentice_schedules
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Add index for faster lookups
CREATE INDEX idx_apprentice_schedules_workspace ON public.apprentice_schedules(workspace_id);
CREATE INDEX idx_apprentice_schedules_user ON public.apprentice_schedules(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_apprentice_schedules_updated_at
BEFORE UPDATE ON public.apprentice_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();