-- Create table for tender partner candidates (pipeline of potential partners)
CREATE TABLE public.tender_partner_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  specialty TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cotraitant',
  status TEXT NOT NULL DEFAULT 'suggested', -- suggested, contacted, interested, confirmed, declined
  fee_percentage NUMERIC(5,2),
  fee_amount NUMERIC(12,2),
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_subject TEXT,
  invitation_body TEXT,
  response_notes TEXT,
  priority INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tender_partner_candidates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view candidates in their workspace"
  ON public.tender_partner_candidates
  FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can insert candidates in their workspace"
  ON public.tender_partner_candidates
  FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can update candidates in their workspace"
  ON public.tender_partner_candidates
  FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can delete candidates in their workspace"
  ON public.tender_partner_candidates
  FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Add trigger for updated_at
CREATE TRIGGER update_tender_partner_candidates_updated_at
  BEFORE UPDATE ON public.tender_partner_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_tender_partner_candidates_tender ON public.tender_partner_candidates(tender_id);
CREATE INDEX idx_tender_partner_candidates_specialty ON public.tender_partner_candidates(specialty);
CREATE INDEX idx_tender_partner_candidates_status ON public.tender_partner_candidates(status);