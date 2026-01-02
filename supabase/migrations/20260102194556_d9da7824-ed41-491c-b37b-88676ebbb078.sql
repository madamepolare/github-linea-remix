-- Table principale des documents commerciaux
CREATE TABLE public.commercial_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL DEFAULT 'quote' CHECK (document_type IN ('quote', 'contract', 'proposal')),
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  client_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  project_type TEXT NOT NULL DEFAULT 'interior' CHECK (project_type IN ('interior', 'architecture', 'scenography')),
  project_address TEXT,
  project_city TEXT,
  project_surface NUMERIC,
  project_budget NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'signed')),
  fee_mode TEXT NOT NULL DEFAULT 'percentage' CHECK (fee_mode IN ('fixed', 'percentage', 'hourly', 'mixed')),
  fee_percentage NUMERIC,
  hourly_rate NUMERIC,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  validity_days INTEGER DEFAULT 30,
  valid_until DATE,
  payment_terms TEXT,
  special_conditions TEXT,
  general_conditions TEXT,
  header_text TEXT,
  footer_text TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des phases du document
CREATE TABLE public.commercial_document_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  phase_code TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  phase_description TEXT,
  percentage_fee NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  is_included BOOLEAN DEFAULT true,
  deliverables JSONB DEFAULT '[]'::jsonb,
  start_date DATE,
  end_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des items/lignes du document
CREATE TABLE public.commercial_document_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.commercial_document_phases(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'mission' CHECK (item_type IN ('mission', 'option', 'expense', 'discount')),
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des templates
CREATE TABLE public.commercial_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'quote' CHECK (document_type IN ('quote', 'contract', 'proposal')),
  project_type TEXT NOT NULL DEFAULT 'interior' CHECK (project_type IN ('interior', 'architecture', 'scenography')),
  default_phases JSONB DEFAULT '[]'::jsonb,
  default_clauses JSONB DEFAULT '{}'::jsonb,
  header_text TEXT,
  footer_text TEXT,
  terms_conditions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commercial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_document_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commercial_documents
CREATE POLICY "Workspace members can view commercial documents"
  ON public.commercial_documents FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create commercial documents"
  ON public.commercial_documents FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update commercial documents"
  ON public.commercial_documents FOR UPDATE
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete commercial documents"
  ON public.commercial_documents FOR DELETE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for commercial_document_phases
CREATE POLICY "Workspace members can manage document phases"
  ON public.commercial_document_phases FOR ALL
  USING (document_id IN (
    SELECT id FROM public.commercial_documents
    WHERE is_workspace_member(workspace_id, auth.uid())
  ));

-- RLS Policies for commercial_document_items
CREATE POLICY "Workspace members can manage document items"
  ON public.commercial_document_items FOR ALL
  USING (document_id IN (
    SELECT id FROM public.commercial_documents
    WHERE is_workspace_member(workspace_id, auth.uid())
  ));

-- RLS Policies for commercial_templates
CREATE POLICY "Workspace members can view templates"
  ON public.commercial_templates FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create templates"
  ON public.commercial_templates FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update templates"
  ON public.commercial_templates FOR UPDATE
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete templates"
  ON public.commercial_templates FOR DELETE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number(doc_type TEXT, ws_id UUID)
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
    WHEN 'quote' THEN 'DEV'
    WHEN 'contract' THEN 'CTR'
    WHEN 'proposal' THEN 'PRO'
    ELSE 'DOC'
  END;
  
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM commercial_documents
  WHERE workspace_id = ws_id
    AND document_type = doc_type
    AND document_number LIKE prefix || '-' || year_str || '-%';
  
  result := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- Trigger to auto-generate document number
CREATE OR REPLACE FUNCTION set_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := generate_document_number(NEW.document_type, NEW.workspace_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_document_number
  BEFORE INSERT ON public.commercial_documents
  FOR EACH ROW
  EXECUTE FUNCTION set_document_number();

-- Update timestamp trigger
CREATE TRIGGER update_commercial_documents_updated_at
  BEFORE UPDATE ON public.commercial_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commercial_templates_updated_at
  BEFORE UPDATE ON public.commercial_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();