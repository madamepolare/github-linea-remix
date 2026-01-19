-- ============================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Restricts sensitive data access using role-based controls
-- ============================================================

-- 1. BILLING PROFILES - Restrict to admin/owner only
DROP POLICY IF EXISTS "Users can view billing profiles in their workspace" ON public.billing_profiles;
DROP POLICY IF EXISTS "Workspace members can view billing profiles" ON public.billing_profiles;

CREATE POLICY "Admins can view billing profiles"
ON public.billing_profiles FOR SELECT
USING (
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 2. INVOICES - Restrict to admin/owner only  
DROP POLICY IF EXISTS "Users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Workspace members can view invoices" ON public.invoices;

CREATE POLICY "Admins can view invoices"
ON public.invoices FOR SELECT
USING (
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 3. PAYROLL_VARIABLES - Restrict to HR (admin/owner) and self only
DROP POLICY IF EXISTS "Users can view their own payroll variables" ON public.payroll_variables;
DROP POLICY IF EXISTS "Admins can view all payroll variables" ON public.payroll_variables;
DROP POLICY IF EXISTS "Workspace members can view payroll variables" ON public.payroll_variables;

CREATE POLICY "Users can view own or admins can view all payroll"
ON public.payroll_variables FOR SELECT
USING (
    user_id = auth.uid() OR
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 4. MEMBER_EMPLOYMENT_INFO - Restrict to HR (admin/owner) and self only
DROP POLICY IF EXISTS "Users can view member employment info" ON public.member_employment_info;
DROP POLICY IF EXISTS "Workspace members can view employment info" ON public.member_employment_info;
DROP POLICY IF EXISTS "Admins can view all employment info" ON public.member_employment_info;

CREATE POLICY "Self or admins can view employment info"
ON public.member_employment_info FOR SELECT
USING (
    user_id = auth.uid() OR
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 5. EMPLOYEE_CONTRACTS - Restrict to HR (admin/owner) and self only
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.employee_contracts;
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.employee_contracts;
DROP POLICY IF EXISTS "Workspace members can view contracts" ON public.employee_contracts;

CREATE POLICY "Self or admins can view contracts"
ON public.employee_contracts FOR SELECT
USING (
    user_id = auth.uid() OR
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 6. TEAM_ABSENCES - Restrict to self and admin only
DROP POLICY IF EXISTS "Users can view team absences" ON public.team_absences;
DROP POLICY IF EXISTS "Workspace members can view absences" ON public.team_absences;
DROP POLICY IF EXISTS "Members can view all absences" ON public.team_absences;

CREATE POLICY "Self or admins can view absences"
ON public.team_absences FOR SELECT
USING (
    user_id = auth.uid() OR
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 7. COMMERCIAL_DOCUMENTS (quotes/pricing) - Restrict to admin only
DROP POLICY IF EXISTS "Users can view commercial documents" ON public.commercial_documents;
DROP POLICY IF EXISTS "Workspace members can view commercial documents" ON public.commercial_documents;

CREATE POLICY "Admins can view commercial documents"
ON public.commercial_documents FOR SELECT
USING (
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 8. PROJECT_PURCHASES - Restrict to admin only
DROP POLICY IF EXISTS "Users can view project purchases" ON public.project_purchases;
DROP POLICY IF EXISTS "Workspace members can view project purchases" ON public.project_purchases;

CREATE POLICY "Admins can view project purchases"
ON public.project_purchases FOR SELECT
USING (
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 9. TENDERS - Restrict to admin only
DROP POLICY IF EXISTS "Users can view tenders" ON public.tenders;
DROP POLICY IF EXISTS "Workspace members can view tenders" ON public.tenders;

CREATE POLICY "Admins can view tenders"
ON public.tenders FOR SELECT
USING (
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 10. TEAM_EVALUATIONS - Restrict to self, evaluator, and HR admin only
DROP POLICY IF EXISTS "Users can view their own evaluations" ON public.team_evaluations;
DROP POLICY IF EXISTS "Evaluators can view their evaluations" ON public.team_evaluations;
DROP POLICY IF EXISTS "Admins can view all evaluations" ON public.team_evaluations;
DROP POLICY IF EXISTS "Workspace members can view evaluations" ON public.team_evaluations;

CREATE POLICY "Self evaluator or admins can view evaluations"
ON public.team_evaluations FOR SELECT
USING (
    user_id = auth.uid() OR 
    evaluator_id = auth.uid() OR
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 11. USER_CHECKINS - Restrict to self and admin only
DROP POLICY IF EXISTS "Users can view their own checkins" ON public.user_checkins;
DROP POLICY IF EXISTS "Workspace members can view team checkins" ON public.user_checkins;

CREATE POLICY "Self or admins can view checkins"
ON public.user_checkins FOR SELECT
USING (
    user_id = auth.uid() OR
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- 12. WORKSPACE_USAGE_LOGS - Restrict to owner only
DROP POLICY IF EXISTS "Users can view workspace usage logs" ON public.workspace_usage_logs;
DROP POLICY IF EXISTS "Workspace members can view usage logs" ON public.workspace_usage_logs;

CREATE POLICY "Owners can view usage logs"
ON public.workspace_usage_logs FOR SELECT
USING (
    public.has_role(auth.uid(), workspace_id, 'owner')
);

-- 13. Tighten CONTACTS table - add role check for sensitive data
-- Create a helper function to check if user has CRM access
CREATE OR REPLACE FUNCTION public.can_access_crm_data(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role_or_higher(_user_id, _workspace_id, 'member')
$$;

-- Note: Keep contacts viewable by members since it's a CRM feature
-- but the function can be used for future restrictions

-- 14. Fix function search paths (security warning)
-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;