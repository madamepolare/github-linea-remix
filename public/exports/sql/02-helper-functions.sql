-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 2: HELPER FUNCTIONS
-- =====================================================
-- Security definer functions for RLS policies
-- =====================================================

-- Check if user is member of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
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
  )
$$;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _workspace_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role = _role
  )
$$;

-- Check if user has a role at or above a minimum level
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _workspace_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND (
        CASE role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'member' THEN 2
          WHEN 'viewer' THEN 1
        END
      ) >= (
        CASE _min_role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'member' THEN 2
          WHEN 'viewer' THEN 1
        END
      )
  )
$$;

-- Get user's role in a workspace
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _workspace_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND workspace_id = _workspace_id
  LIMIT 1
$$;

-- Check if user is workspace admin
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

-- Check if user can view sensitive contacts
CREATE OR REPLACE FUNCTION public.can_view_sensitive_contacts(_workspace_id uuid, _user_id uuid)
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
      AND role IN ('owner', 'admin')
  )
$$;

-- Check if user can access CRM data
CREATE OR REPLACE FUNCTION public.can_access_crm_data(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role_or_higher(_user_id, _workspace_id, 'member')
$$;

-- Check element visibility
CREATE OR REPLACE FUNCTION public.can_view_element(
  _element_visibility element_visibility, 
  _element_workspace_id uuid, 
  _element_created_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Creator can always see their element
  IF _element_created_by = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Visibility "all" = any workspace member can see
  IF _element_visibility = 'all' THEN
    RETURN true;
  END IF;
  
  -- Get user's role in the workspace
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
    AND workspace_id = _element_workspace_id
  LIMIT 1;
  
  -- Fallback to workspace_members if user_roles is empty
  IF v_user_role IS NULL THEN
    SELECT role INTO v_user_role
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND workspace_id = _element_workspace_id
    LIMIT 1;
  END IF;
  
  -- Check based on required visibility
  IF _element_visibility = 'admin' AND v_user_role IN ('admin', 'owner') THEN
    RETURN true;
  END IF;
  
  IF _element_visibility = 'owner' AND v_user_role = 'owner' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Get user's workspace IDs
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id
  FROM public.workspace_members
  WHERE user_id = _user_id
$$;

-- Check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _workspace_id uuid, _permission_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
  _custom_grant boolean;
  _default_roles app_role[] := CASE _permission_code
    -- Projects
    WHEN 'projects.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'projects.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'projects.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'projects.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'projects.archive' THEN ARRAY['owner', 'admin']::app_role[]
    -- CRM
    WHEN 'crm.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'crm.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'crm.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'crm.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'crm.view_sensitive' THEN ARRAY['owner', 'admin']::app_role[]
    -- Commercial
    WHEN 'commercial.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'commercial.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'commercial.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'commercial.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'commercial.send' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'commercial.sign' THEN ARRAY['owner', 'admin']::app_role[]
    -- Invoicing
    WHEN 'invoicing.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'invoicing.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'invoicing.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'invoicing.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'invoicing.send' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'invoicing.mark_paid' THEN ARRAY['owner', 'admin']::app_role[]
    -- Tasks
    WHEN 'tasks.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'tasks.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'tasks.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'tasks.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'tasks.assign' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    -- Team
    WHEN 'team.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'team.invite' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.manage_roles' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.remove' THEN ARRAY['owner', 'admin']::app_role[]
    -- Settings
    WHEN 'settings.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'settings.edit' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'settings.manage_workspace' THEN ARRAY['owner']::app_role[]
    WHEN 'settings.manage_billing' THEN ARRAY['owner']::app_role[]
    ELSE ARRAY[]::app_role[]
  END;
BEGIN
  -- Get user's role in this workspace
  SELECT role INTO _user_role
  FROM user_roles
  WHERE user_id = _user_id AND workspace_id = _workspace_id;
  
  -- Fallback to workspace_members
  IF _user_role IS NULL THEN
    SELECT role INTO _user_role
    FROM workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id;
  END IF;
  
  IF _user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for workspace-specific override
  SELECT granted INTO _custom_grant
  FROM workspace_role_permissions
  WHERE workspace_id = _workspace_id 
    AND role = _user_role 
    AND permission_code = _permission_code;
  
  -- If custom override exists, use it
  IF _custom_grant IS NOT NULL THEN
    RETURN _custom_grant;
  END IF;
  
  -- Otherwise use default matrix
  RETURN _user_role = ANY(_default_roles);
END;
$$;

-- Generate document number
CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type text, ws_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  next_num INTEGER;
  result TEXT;
BEGIN
  prefix := CASE doc_type
    WHEN 'quote' THEN 'D'
    WHEN 'contract' THEN 'C'
    WHEN 'proposal' THEN 'P'
    ELSE 'X'
  END;
  
  year_str := TO_CHAR(NOW(), 'YY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM commercial_documents
  WHERE workspace_id = ws_id
    AND document_type = doc_type
    AND document_number ~ ('^' || prefix || year_str || '[0-9]+$');
  
  result := prefix || year_str || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(inv_type text, ws_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  next_num INTEGER;
  result TEXT;
BEGIN
  prefix := CASE inv_type
    WHEN 'standard' THEN 'FAC'
    WHEN 'credit_note' THEN 'AVO'
    WHEN 'proforma' THEN 'PRO'
    WHEN 'deposit' THEN 'ACO'
    ELSE 'FAC'
  END;
  
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE workspace_id = ws_id
    AND invoice_type = inv_type
    AND invoice_number LIKE prefix || '-' || year_str || '-%';
  
  result := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- Update timestamp column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Calculate working days
CREATE OR REPLACE FUNCTION public.calculate_working_days(
  p_workspace_id uuid, 
  p_start_date date, 
  p_end_date date, 
  p_start_half_day boolean DEFAULT false, 
  p_end_half_day boolean DEFAULT false
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days NUMERIC := 0;
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_is_holiday BOOLEAN;
BEGIN
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date)::INTEGER;
    
    -- Skip weekends (0 = Sunday, 6 = Saturday)
    IF v_day_of_week NOT IN (0, 6) THEN
      -- Check if it's a holiday
      SELECT EXISTS(
        SELECT 1 FROM public.french_holidays 
        WHERE workspace_id = p_workspace_id 
        AND holiday_date = v_current_date
        AND is_worked = false
      ) INTO v_is_holiday;
      
      IF NOT v_is_holiday THEN
        IF v_current_date = p_start_date AND p_start_half_day THEN
          v_days := v_days + 0.5;
        ELSIF v_current_date = p_end_date AND p_end_half_day THEN
          v_days := v_days + 0.5;
        ELSE
          v_days := v_days + 1;
        END IF;
      END IF;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN v_days;
END;
$$;
