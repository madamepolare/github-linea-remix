-- Add new fields to tenders table
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS consultation_number TEXT,
ADD COLUMN IF NOT EXISTS group_code TEXT,
ADD COLUMN IF NOT EXISTS market_object TEXT,
ADD COLUMN IF NOT EXISTS client_direction TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_contact_name TEXT,
ADD COLUMN IF NOT EXISTS client_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS client_contact_email TEXT,
ADD COLUMN IF NOT EXISTS site_visit_contact_name TEXT,
ADD COLUMN IF NOT EXISTS site_visit_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS site_visit_contact_email TEXT,
ADD COLUMN IF NOT EXISTS site_visit_secondary_contact JSONB,
ADD COLUMN IF NOT EXISTS allows_negotiation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS negotiation_candidates_count INTEGER,
ADD COLUMN IF NOT EXISTS negotiation_method TEXT,
ADD COLUMN IF NOT EXISTS offer_validity_days INTEGER DEFAULT 180,
ADD COLUMN IF NOT EXISTS dce_delivery_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dce_delivery_duration_months INTEGER,
ADD COLUMN IF NOT EXISTS allows_joint_venture BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS joint_venture_type TEXT,
ADD COLUMN IF NOT EXISTS mandataire_must_be_solidary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_variants BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_contact_email TEXT,
ADD COLUMN IF NOT EXISTS questions_deadline_days INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS work_nature_tags TEXT[];

-- Create tender_required_documents table
CREATE TABLE IF NOT EXISTS public.tender_required_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_category TEXT NOT NULL DEFAULT 'candidature' CHECK (document_category IN ('candidature', 'offre')),
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  template_url TEXT,
  is_completed BOOLEAN DEFAULT false,
  file_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add parent_criterion_id to tender_criteria for sub-criteria support
ALTER TABLE public.tender_criteria 
ADD COLUMN IF NOT EXISTS parent_criterion_id UUID REFERENCES public.tender_criteria(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS criterion_type TEXT DEFAULT 'technical' CHECK (criterion_type IN ('price', 'technical', 'delay', 'environmental', 'social'));

-- Enable RLS on tender_required_documents
ALTER TABLE public.tender_required_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for tender_required_documents
CREATE POLICY "Users can view required documents in their workspace"
  ON public.tender_required_documents
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create required documents in their workspace"
  ON public.tender_required_documents
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update required documents in their workspace"
  ON public.tender_required_documents
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete required documents in their workspace"
  ON public.tender_required_documents
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tender_required_docs_tender ON public.tender_required_documents(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_required_docs_workspace ON public.tender_required_documents(workspace_id);