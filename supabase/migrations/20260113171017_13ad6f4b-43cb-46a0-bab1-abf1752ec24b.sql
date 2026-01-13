-- Create table to store AI-generated prospects before they are converted to contacts/leads
CREATE TABLE public.ai_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Company info
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_address TEXT,
  company_city TEXT,
  company_postal_code TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_industry TEXT,
  
  -- Contact info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  
  -- AI metadata
  source_query TEXT NOT NULL,
  source_url TEXT,
  confidence_score NUMERIC,
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'converted', 'rejected')),
  converted_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  converted_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  converted_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.ai_prospects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage AI prospects in their workspace" 
ON public.ai_prospects 
FOR ALL 
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Index for faster lookups
CREATE INDEX idx_ai_prospects_workspace_id ON public.ai_prospects(workspace_id);
CREATE INDEX idx_ai_prospects_status ON public.ai_prospects(status);

-- Trigger for updated_at
CREATE TRIGGER update_ai_prospects_updated_at
  BEFORE UPDATE ON public.ai_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();