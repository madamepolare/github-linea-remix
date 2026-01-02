-- Update projects table with new columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'interior',
ADD COLUMN IF NOT EXISTS crm_company_id UUID REFERENCES crm_companies(id),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS surface_area NUMERIC,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS current_phase_id UUID;

-- Create project_phases table
CREATE TABLE public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK constraint for current_phase_id after table exists
ALTER TABLE public.projects 
ADD CONSTRAINT projects_current_phase_id_fkey 
FOREIGN KEY (current_phase_id) REFERENCES project_phases(id) ON DELETE SET NULL;

-- Create project_moe_team table (Maîtrise d'Oeuvre team)
CREATE TABLE public.project_moe_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  crm_company_id UUID REFERENCES crm_companies(id),
  contact_id UUID REFERENCES contacts(id),
  role TEXT NOT NULL,
  is_lead BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_deliverables table
CREATE TABLE public.project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deliverable_email_templates table
CREATE TABLE public.deliverable_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  phase_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_lots table (Chantier lots)
CREATE TABLE public.project_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  crm_company_id UUID REFERENCES crm_companies(id),
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_meetings table
CREATE TABLE public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_number INTEGER,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_observations table
CREATE TABLE public.project_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  meeting_id UUID REFERENCES project_meetings(id) ON DELETE SET NULL,
  lot_id UUID REFERENCES project_lots(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  photo_urls TEXT[],
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_moe_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_observations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_phases
CREATE POLICY "Workspace members can view phases" ON public.project_phases
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create phases" ON public.project_phases
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update phases" ON public.project_phases
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete phases" ON public.project_phases
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for project_moe_team
CREATE POLICY "Workspace members can view moe team" ON public.project_moe_team
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create moe team" ON public.project_moe_team
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update moe team" ON public.project_moe_team
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete moe team" ON public.project_moe_team
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for project_deliverables
CREATE POLICY "Workspace members can view deliverables" ON public.project_deliverables
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create deliverables" ON public.project_deliverables
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update deliverables" ON public.project_deliverables
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete deliverables" ON public.project_deliverables
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for deliverable_email_templates
CREATE POLICY "Workspace members can view templates" ON public.deliverable_email_templates
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create templates" ON public.deliverable_email_templates
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update templates" ON public.deliverable_email_templates
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete templates" ON public.deliverable_email_templates
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for project_lots
CREATE POLICY "Workspace members can view lots" ON public.project_lots
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create lots" ON public.project_lots
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update lots" ON public.project_lots
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete lots" ON public.project_lots
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for project_meetings
CREATE POLICY "Workspace members can view meetings" ON public.project_meetings
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create meetings" ON public.project_meetings
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update meetings" ON public.project_meetings
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete meetings" ON public.project_meetings
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for project_observations
CREATE POLICY "Workspace members can view observations" ON public.project_observations
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can create observations" ON public.project_observations
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can update observations" ON public.project_observations
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Workspace members can delete observations" ON public.project_observations
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_moe_team_updated_at BEFORE UPDATE ON public.project_moe_team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_deliverables_updated_at BEFORE UPDATE ON public.project_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliverable_email_templates_updated_at BEFORE UPDATE ON public.deliverable_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_lots_updated_at BEFORE UPDATE ON public.project_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_meetings_updated_at BEFORE UPDATE ON public.project_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_observations_updated_at BEFORE UPDATE ON public.project_observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();