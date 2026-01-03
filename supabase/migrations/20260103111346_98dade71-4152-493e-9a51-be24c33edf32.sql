
-- Create enum type for tender status
CREATE TYPE tender_status AS ENUM ('repere', 'en_analyse', 'go', 'no_go', 'en_montage', 'depose', 'gagne', 'perdu');

-- Create enum type for procedure type
CREATE TYPE procedure_type AS ENUM ('ouvert', 'restreint', 'adapte', 'concours', 'dialogue', 'partenariat');

-- Create enum type for team member role
CREATE TYPE tender_team_role AS ENUM ('mandataire', 'cotraitant', 'sous_traitant');

-- Create enum type for invitation response
CREATE TYPE invitation_response AS ENUM ('pending', 'accepted', 'declined');

-- Main tenders table
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID,
  reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_type TEXT DEFAULT 'public',
  contracting_authority TEXT,
  estimated_budget NUMERIC,
  budget_disclosed BOOLEAN DEFAULT true,
  location TEXT,
  region TEXT,
  surface_area NUMERIC,
  procedure_type procedure_type DEFAULT 'ouvert',
  status tender_status DEFAULT 'repere',
  go_decision_date TIMESTAMP WITH TIME ZONE,
  go_decision_by UUID,
  go_decision_notes TEXT,
  submission_deadline TIMESTAMP WITH TIME ZONE,
  site_visit_required BOOLEAN DEFAULT false,
  site_visit_date TIMESTAMP WITH TIME ZONE,
  jury_date TIMESTAMP WITH TIME ZONE,
  results_date TIMESTAMP WITH TIME ZONE,
  source_platform TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tender documents table (DCE files)
CREATE TABLE public.tender_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'autre',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  is_analyzed BOOLEAN DEFAULT false,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_at TIMESTAMP WITH TIME ZONE
);

-- Tender requirements (exigences extraites)
CREATE TABLE public.tender_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  requirement_type TEXT DEFAULT 'competence',
  description TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  specialty TEXT,
  source_document_id UUID REFERENCES public.tender_documents(id) ON DELETE SET NULL,
  ai_confidence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tender criteria (critères de sélection)
CREATE TABLE public.tender_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  criterion_name TEXT NOT NULL,
  weight NUMERIC,
  sub_criteria JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tender team members
CREATE TABLE public.tender_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  role tender_team_role DEFAULT 'cotraitant',
  specialty TEXT,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status invitation_response DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tender deliverables (livrables réglementaires)
CREATE TABLE public.tender_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  deliverable_type TEXT DEFAULT 'autre',
  name TEXT NOT NULL,
  description TEXT,
  responsible_type TEXT DEFAULT 'mandataire',
  responsible_company_ids UUID[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  file_urls TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Partner invitations
CREATE TABLE public.tender_partner_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  role_needed tender_team_role,
  specialty_needed TEXT,
  email_subject TEXT,
  email_body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  response invitation_response DEFAULT 'pending',
  response_date TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Technical memoir sections
CREATE TABLE public.tender_technical_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  section_type TEXT DEFAULT 'autre',
  sort_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  content TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_source_documents UUID[] DEFAULT '{}',
  last_edited_by UUID,
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Knowledge base entries
CREATE TABLE public.knowledge_base_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'paragraph',
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  project_types TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_technical_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenders
CREATE POLICY "Workspace members can view tenders" ON public.tenders
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create tenders" ON public.tenders
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update tenders" ON public.tenders
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete tenders" ON public.tenders
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for tender_documents
CREATE POLICY "Workspace members can manage tender documents" ON public.tender_documents
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for tender_requirements
CREATE POLICY "Workspace members can manage tender requirements" ON public.tender_requirements
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for tender_criteria
CREATE POLICY "Workspace members can manage tender criteria" ON public.tender_criteria
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for tender_team_members
CREATE POLICY "Workspace members can manage tender team" ON public.tender_team_members
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for tender_deliverables
CREATE POLICY "Workspace members can manage tender deliverables" ON public.tender_deliverables
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for tender_partner_invitations
CREATE POLICY "Workspace members can manage partner invitations" ON public.tender_partner_invitations
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for tender_technical_sections
CREATE POLICY "Workspace members can manage technical sections" ON public.tender_technical_sections
  FOR ALL USING (
    tender_id IN (SELECT id FROM public.tenders WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- RLS Policies for knowledge_base_entries
CREATE POLICY "Workspace members can view knowledge base" ON public.knowledge_base_entries
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create knowledge base entries" ON public.knowledge_base_entries
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update knowledge base entries" ON public.knowledge_base_entries
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete knowledge base entries" ON public.knowledge_base_entries
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for tender documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tender-documents', 'tender-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tender documents
CREATE POLICY "Authenticated users can upload tender documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tender-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view tender documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'tender-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tender documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'tender-documents' AND auth.role() = 'authenticated');
