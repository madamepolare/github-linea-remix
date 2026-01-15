-- Add parent_id column for sub-projects hierarchy
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add framework/contract type fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'standard' CHECK (contract_type IN ('standard', 'framework')),
ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC,
ADD COLUMN IF NOT EXISTS framework_start_date DATE,
ADD COLUMN IF NOT EXISTS framework_end_date DATE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Create index for efficient sub-project queries
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON public.projects(parent_id);

-- Create index for framework projects
CREATE INDEX IF NOT EXISTS idx_projects_contract_type ON public.projects(contract_type) WHERE contract_type = 'framework';

-- Add RLS policy for sub-projects to inherit parent permissions
CREATE POLICY "Users can view sub-projects of their projects"
ON public.projects
FOR SELECT
USING (
  parent_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = projects.parent_id 
    AND p.workspace_id = projects.workspace_id
  )
);

-- Comment for documentation
COMMENT ON COLUMN public.projects.parent_id IS 'Reference to parent project for sub-projects (framework agreements)';
COMMENT ON COLUMN public.projects.contract_type IS 'Type of contract: standard or framework (accord-cadre)';
COMMENT ON COLUMN public.projects.monthly_budget IS 'Monthly budget for framework agreements';
COMMENT ON COLUMN public.projects.framework_start_date IS 'Start date of framework agreement';
COMMENT ON COLUMN public.projects.framework_end_date IS 'End date of framework agreement';
COMMENT ON COLUMN public.projects.auto_renew IS 'Whether framework agreement auto-renews';