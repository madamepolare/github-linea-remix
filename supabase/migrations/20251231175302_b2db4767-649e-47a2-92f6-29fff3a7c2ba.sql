-- CRM Pipelines (for lead stages)
CREATE TABLE public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline Stages
CREATE TABLE public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  probability INTEGER DEFAULT 50,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Companies
CREATE TABLE public.crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT, -- 'maitre_ouvrage', 'bet', 'entreprise', 'fournisseur', 'partenaire'
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  logo_url TEXT,
  notes TEXT,
  bet_specialties TEXT[], -- for BET type: ['structure', 'fluides', 'acoustique']
  billing_email TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  crm_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- job title
  contact_type TEXT DEFAULT 'client', -- 'client', 'partner', 'supplier'
  avatar_url TEXT,
  location TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leads/Opportunities
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  crm_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new', -- 'new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
  pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
  estimated_value NUMERIC,
  probability INTEGER DEFAULT 50,
  source TEXT, -- 'referral', 'website', 'network', 'tender'
  description TEXT,
  next_action TEXT,
  next_action_date DATE,
  assigned_to UUID,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Activities
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'task'
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all CRM tables
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_pipelines
CREATE POLICY "Workspace members can view pipelines"
  ON public.crm_pipelines FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create pipelines"
  ON public.crm_pipelines FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update pipelines"
  ON public.crm_pipelines FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete pipelines"
  ON public.crm_pipelines FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for crm_pipeline_stages (via pipeline's workspace)
CREATE POLICY "Workspace members can view stages"
  ON public.crm_pipeline_stages FOR SELECT
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM public.crm_pipelines 
      WHERE is_workspace_member(workspace_id, auth.uid())
    )
  );

CREATE POLICY "Workspace members can manage stages"
  ON public.crm_pipeline_stages FOR ALL
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM public.crm_pipelines 
      WHERE is_workspace_member(workspace_id, auth.uid())
    )
  );

-- RLS Policies for crm_companies
CREATE POLICY "Workspace members can view companies"
  ON public.crm_companies FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create companies"
  ON public.crm_companies FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update companies"
  ON public.crm_companies FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete companies"
  ON public.crm_companies FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for contacts
CREATE POLICY "Workspace members can view contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for leads
CREATE POLICY "Workspace members can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for lead_activities
CREATE POLICY "Workspace members can view activities"
  ON public.lead_activities FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create activities"
  ON public.lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update activities"
  ON public.lead_activities FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete activities"
  ON public.lead_activities FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id, auth.uid()));

-- Indexes for performance
CREATE INDEX idx_crm_companies_workspace ON public.crm_companies(workspace_id);
CREATE INDEX idx_crm_companies_industry ON public.crm_companies(industry);
CREATE INDEX idx_contacts_workspace ON public.contacts(workspace_id);
CREATE INDEX idx_contacts_company ON public.contacts(crm_company_id);
CREATE INDEX idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX idx_leads_pipeline ON public.leads(pipeline_id);
CREATE INDEX idx_leads_stage ON public.leads(stage_id);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id);

-- Updated at triggers
CREATE TRIGGER update_crm_pipelines_updated_at
  BEFORE UPDATE ON public.crm_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();