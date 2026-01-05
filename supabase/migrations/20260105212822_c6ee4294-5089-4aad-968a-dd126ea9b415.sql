-- Add lead_id to projects (track origin from CRM)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add project_id to leads (link to converted project)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add relations to tenders
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create entity_activities table for unified activity tracking
CREATE TABLE IF NOT EXISTS public.entity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'project', 'lead', 'company', 'contact', 'invoice', 'document', 'tender'
  entity_id UUID NOT NULL,
  related_entity_type TEXT, -- For cross-entity activities
  related_entity_id UUID,
  activity_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'linked', 'converted', 'document_sent', etc.
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.entity_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for entity_activities
CREATE POLICY "Users can view activities in their workspace"
  ON public.entity_activities FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can create activities in their workspace"
  ON public.entity_activities FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_activities_entity ON public.entity_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_activities_workspace ON public.entity_activities(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entity_activities_related ON public.entity_activities(related_entity_type, related_entity_id);

-- Index on new foreign keys
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_tenders_lead_id ON public.tenders(lead_id);
CREATE INDEX IF NOT EXISTS idx_tenders_project_id ON public.tenders(project_id);