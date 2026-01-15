-- Add billing_type and linked documents to projects for supplementary work tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'included' CHECK (billing_type IN ('included', 'supplementary')),
ADD COLUMN IF NOT EXISTS client_request_id UUID REFERENCES client_portal_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linked_quote_id UUID REFERENCES commercial_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linked_order_id UUID REFERENCES commercial_documents(id) ON DELETE SET NULL;

-- Add framework_project_id to client_portal_links
ALTER TABLE public.client_portal_links 
ADD COLUMN IF NOT EXISTS framework_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add extra fields to client_portal_requests for richer submissions
ALTER TABLE public.client_portal_requests 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS desired_deadline DATE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_billing_type ON public.projects(billing_type);
CREATE INDEX IF NOT EXISTS idx_projects_client_request_id ON public.projects(client_request_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_links_framework_project ON public.client_portal_links(framework_project_id);