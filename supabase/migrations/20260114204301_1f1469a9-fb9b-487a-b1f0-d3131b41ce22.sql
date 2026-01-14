-- Create company_portal_links table for company portals
CREATE TABLE public.company_portal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  custom_slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  can_view_projects BOOLEAN DEFAULT true,
  can_view_tasks BOOLEAN DEFAULT true,
  can_add_tasks BOOLEAN DEFAULT false,
  can_view_quotes BOOLEAN DEFAULT true,
  can_view_invoices BOOLEAN DEFAULT true,
  can_view_time_entries BOOLEAN DEFAULT false,
  can_view_contacts BOOLEAN DEFAULT true,
  project_ids TEXT[],
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.company_portal_links ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view company portal links in their workspace"
ON public.company_portal_links
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create company portal links in their workspace"
ON public.company_portal_links
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update company portal links in their workspace"
ON public.company_portal_links
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete company portal links in their workspace"
ON public.company_portal_links
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Create company_portal_requests table
CREATE TABLE public.company_portal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  portal_link_id UUID NOT NULL REFERENCES public.company_portal_links(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_portal_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view company portal requests in their workspace"
ON public.company_portal_requests
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage company portal requests in their workspace"
ON public.company_portal_requests
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_company_portal_links_updated_at
BEFORE UPDATE ON public.company_portal_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_portal_requests_updated_at
BEFORE UPDATE ON public.company_portal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();