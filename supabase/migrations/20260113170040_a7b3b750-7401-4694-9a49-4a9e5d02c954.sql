-- Add department_id to billing_profiles for department-level billing
ALTER TABLE public.billing_profiles 
ADD COLUMN department_id UUID REFERENCES public.company_departments(id) ON DELETE CASCADE;

-- Add index for department lookups
CREATE INDEX idx_billing_profiles_department_id ON public.billing_profiles(department_id);

-- Update RLS policy to include department access
DROP POLICY IF EXISTS "Users can manage billing profiles in their workspace" ON public.billing_profiles;

CREATE POLICY "Users can manage billing profiles in their workspace" 
ON public.billing_profiles 
FOR ALL 
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT id FROM workspaces WHERE id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
);