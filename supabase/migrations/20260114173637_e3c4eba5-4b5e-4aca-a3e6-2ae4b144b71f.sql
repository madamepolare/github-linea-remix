-- Create client_portal_links table
CREATE TABLE public.client_portal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  custom_slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  -- Permissions
  can_view_projects BOOLEAN DEFAULT true,
  can_view_tasks BOOLEAN DEFAULT true,
  can_add_tasks BOOLEAN DEFAULT false,
  can_view_invoices BOOLEAN DEFAULT true,
  can_view_quotes BOOLEAN DEFAULT true,
  can_view_time_entries BOOLEAN DEFAULT false,
  -- Filtres
  project_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for fast lookups
CREATE INDEX idx_client_portal_links_token ON public.client_portal_links(token);
CREATE INDEX idx_client_portal_links_slug ON public.client_portal_links(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX idx_client_portal_links_contact ON public.client_portal_links(contact_id);
CREATE INDEX idx_client_portal_links_workspace ON public.client_portal_links(workspace_id);

-- Enable RLS
ALTER TABLE public.client_portal_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Workspace members can manage portal links
CREATE POLICY "Workspace members can view portal links"
ON public.client_portal_links
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workspace members can create portal links"
ON public.client_portal_links
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workspace members can update portal links"
ON public.client_portal_links
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workspace members can delete portal links"
ON public.client_portal_links
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_portal_links_updated_at
BEFORE UPDATE ON public.client_portal_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create client_portal_requests table for tasks submitted by clients
CREATE TABLE public.client_portal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  portal_link_id UUID NOT NULL REFERENCES client_portal_links(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'converted', 'rejected')),
  converted_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_portal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
CREATE POLICY "Workspace members can view portal requests"
ON public.client_portal_requests
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workspace members can manage portal requests"
ON public.client_portal_requests
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_portal_requests_updated_at
BEFORE UPDATE ON public.client_portal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();