-- Add client_daily_rate to member_employment_info table
ALTER TABLE public.member_employment_info 
ADD COLUMN IF NOT EXISTS client_daily_rate numeric DEFAULT NULL;

COMMENT ON COLUMN public.member_employment_info.client_daily_rate IS 'Default client daily rate for this member (used when no project-specific rate is set)';

-- Create member_rate_history table for tracking rate and salary changes
CREATE TABLE IF NOT EXISTS public.member_rate_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('salary', 'client_rate', 'project_rate')),
  old_value numeric,
  new_value numeric,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_rate_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for member_rate_history
CREATE POLICY "Admins can view rate history in their workspace"
  ON public.member_rate_history
  FOR SELECT
  USING (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can create rate history in their workspace"
  ON public.member_rate_history
  FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete rate history in their workspace"
  ON public.member_rate_history
  FOR DELETE
  USING (is_workspace_admin(workspace_id, auth.uid()));

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_member_rate_history_user_workspace 
  ON public.member_rate_history(user_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_member_rate_history_effective_date 
  ON public.member_rate_history(effective_date DESC);

-- Create function to automatically log salary/rate changes
CREATE OR REPLACE FUNCTION log_member_employment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log salary changes
  IF OLD.salary_monthly IS DISTINCT FROM NEW.salary_monthly THEN
    INSERT INTO public.member_rate_history (
      workspace_id, user_id, change_type, old_value, new_value, effective_date, changed_by
    ) VALUES (
      NEW.workspace_id, NEW.user_id, 'salary', OLD.salary_monthly, NEW.salary_monthly, CURRENT_DATE, auth.uid()
    );
  END IF;
  
  -- Log client rate changes
  IF OLD.client_daily_rate IS DISTINCT FROM NEW.client_daily_rate THEN
    INSERT INTO public.member_rate_history (
      workspace_id, user_id, change_type, old_value, new_value, effective_date, changed_by
    ) VALUES (
      NEW.workspace_id, NEW.user_id, 'client_rate', OLD.client_daily_rate, NEW.client_daily_rate, CURRENT_DATE, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for logging changes
DROP TRIGGER IF EXISTS trigger_log_member_employment_changes ON public.member_employment_info;
CREATE TRIGGER trigger_log_member_employment_changes
  AFTER UPDATE ON public.member_employment_info
  FOR EACH ROW
  EXECUTE FUNCTION log_member_employment_changes();

-- Create function to log project member rate changes
CREATE OR REPLACE FUNCTION log_project_member_rate_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  -- Get workspace_id from the project
  SELECT workspace_id INTO v_workspace_id 
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  IF OLD.client_daily_rate IS DISTINCT FROM NEW.client_daily_rate THEN
    INSERT INTO public.member_rate_history (
      workspace_id, user_id, change_type, old_value, new_value, project_id, effective_date, changed_by
    ) VALUES (
      v_workspace_id, NEW.user_id, 'project_rate', OLD.client_daily_rate, NEW.client_daily_rate, NEW.project_id, CURRENT_DATE, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for logging project member rate changes
DROP TRIGGER IF EXISTS trigger_log_project_member_rate_changes ON public.project_members;
CREATE TRIGGER trigger_log_project_member_rate_changes
  AFTER UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION log_project_member_rate_changes();