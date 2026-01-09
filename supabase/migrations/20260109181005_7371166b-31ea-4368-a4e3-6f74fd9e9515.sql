-- Add daily_rate to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0;

-- Create member_employment_info table for sensitive employee data
CREATE TABLE IF NOT EXISTS public.member_employment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  salary_monthly numeric,
  contract_type text, -- 'CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'
  start_date date,
  end_date date,
  trial_end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.member_employment_info ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role IN ('admin', 'owner')
  )
$$;

-- RLS policy: Only admins/owners can manage employment info
CREATE POLICY "Admins can manage employment info"
ON public.member_employment_info
FOR ALL
TO authenticated
USING (public.is_workspace_admin(workspace_id, auth.uid()))
WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_member_employment_info_updated_at
BEFORE UPDATE ON public.member_employment_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();