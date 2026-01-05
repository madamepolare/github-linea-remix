-- Table des templates de documents
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL, -- 'administrative', 'project', 'hr'
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  content_schema JSONB NOT NULL DEFAULT '[]',
  pdf_template JSONB DEFAULT '{}',
  default_content JSONB DEFAULT '{}',
  
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table principale des documents de l'agence
CREATE TABLE public.agency_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL, -- 'administrative', 'project', 'hr', 'commercial'
  document_type TEXT NOT NULL,
  
  title TEXT NOT NULL,
  document_number TEXT,
  description TEXT,
  
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  related_document_id UUID,
  
  content JSONB DEFAULT '{}',
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  
  pdf_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  status TEXT DEFAULT 'draft',
  valid_from DATE,
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX idx_agency_documents_workspace ON public.agency_documents(workspace_id);
CREATE INDEX idx_agency_documents_category ON public.agency_documents(category);
CREATE INDEX idx_agency_documents_project ON public.agency_documents(project_id);
CREATE INDEX idx_agency_documents_status ON public.agency_documents(status);
CREATE INDEX idx_document_templates_workspace ON public.document_templates(workspace_id);

-- Enable RLS
ALTER TABLE public.agency_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour agency_documents
CREATE POLICY "Users can view documents in their workspace"
ON public.agency_documents FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create documents in their workspace"
ON public.agency_documents FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update documents in their workspace"
ON public.agency_documents FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can delete documents in their workspace"
ON public.agency_documents FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies pour document_templates
CREATE POLICY "Users can view templates in their workspace"
ON public.document_templates FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create templates in their workspace"
ON public.document_templates FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update templates in their workspace"
ON public.document_templates FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can delete templates in their workspace"
ON public.document_templates FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));

-- Triggers pour updated_at
CREATE TRIGGER update_agency_documents_updated_at
BEFORE UPDATE ON public.agency_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour générer les numéros de documents
CREATE OR REPLACE FUNCTION public.generate_agency_document_number(doc_type TEXT, ws_id UUID)
RETURNS TEXT
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
    WHEN 'power_of_attorney' THEN 'POA'
    WHEN 'attestation_insurance' THEN 'ATT'
    WHEN 'attestation_fiscal' THEN 'ATT'
    WHEN 'attestation_urssaf' THEN 'ATT'
    WHEN 'service_order' THEN 'OS'
    WHEN 'invoice' THEN 'FAC'
    WHEN 'amendment' THEN 'AVE'
    WHEN 'formal_notice' THEN 'MED'
    WHEN 'expense_report' THEN 'NDF'
    WHEN 'mission_order' THEN 'ODM'
    ELSE 'DOC'
  END;
  
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM agency_documents
  WHERE workspace_id = ws_id
    AND document_type = doc_type
    AND document_number LIKE prefix || '-' || year_str || '-%';
  
  result := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$;