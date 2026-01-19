-- Add justification_url to team_absences
ALTER TABLE public.team_absences 
ADD COLUMN IF NOT EXISTS justification_url TEXT;

-- Add computed_days column to team_absences
ALTER TABLE public.team_absences 
ADD COLUMN IF NOT EXISTS computed_days DECIMAL(4,2);

-- Create employee_objectives table for SMART objectives
CREATE TABLE IF NOT EXISTS public.employee_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  evaluator_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'performance',
  target_value TEXT,
  current_value TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  weight INTEGER DEFAULT 1,
  due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
  evaluation_id UUID REFERENCES public.team_evaluations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on employee_objectives
ALTER TABLE public.employee_objectives ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_objectives
CREATE POLICY "Users can view their own objectives" 
ON public.employee_objectives FOR SELECT 
USING (user_id = auth.uid() OR evaluator_id = auth.uid());

CREATE POLICY "Workspace members can view objectives" 
ON public.employee_objectives FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = employee_objectives.workspace_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can insert objectives" 
ON public.employee_objectives FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = employee_objectives.workspace_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update objectives" 
ON public.employee_objectives FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = employee_objectives.workspace_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete objectives" 
ON public.employee_objectives FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = employee_objectives.workspace_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Add more payroll columns for enriched export
ALTER TABLE public.payroll_variables 
ADD COLUMN IF NOT EXISTS meal_vouchers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remote_work_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remote_allowance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS expense_reimbursement DECIMAL(10,2) DEFAULT 0;

-- Create trigger for updated_at on employee_objectives
CREATE TRIGGER update_employee_objectives_updated_at
BEFORE UPDATE ON public.employee_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_objectives_user_id ON public.employee_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_objectives_workspace_id ON public.employee_objectives(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_absences_justification ON public.team_absences(justification_url) WHERE justification_url IS NOT NULL;