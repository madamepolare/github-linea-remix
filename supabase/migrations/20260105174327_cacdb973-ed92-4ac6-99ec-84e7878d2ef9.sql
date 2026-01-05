
-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _workspace_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Function to check if user has at least a certain role level
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id UUID, _workspace_id UUID, _min_role app_role)
RETURNS BOOLEAN
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

-- Function to get user's role in a workspace
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _workspace_id UUID)
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

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their workspace"
ON public.user_roles
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- Trigger to sync with workspace_members on insert
CREATE OR REPLACE FUNCTION public.sync_user_role_on_member_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, workspace_id, role)
  VALUES (NEW.user_id, NEW.workspace_id, NEW.role::app_role)
  ON CONFLICT (user_id, workspace_id) 
  DO UPDATE SET role = EXCLUDED.role, updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_workspace_member_insert
AFTER INSERT ON public.workspace_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_on_member_insert();

-- Sync existing workspace_members to user_roles
INSERT INTO public.user_roles (user_id, workspace_id, role)
SELECT user_id, workspace_id, role::app_role
FROM public.workspace_members
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, workspace_id) DO NOTHING;

-- Update timestamp trigger
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
