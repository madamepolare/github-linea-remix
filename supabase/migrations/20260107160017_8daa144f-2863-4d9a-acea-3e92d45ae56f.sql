-- Add new columns to tenders table for the refonte
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS tender_type text DEFAULT 'architecture' CHECK (tender_type IN ('architecture', 'scenographie')),
ADD COLUMN IF NOT EXISTS submission_type text DEFAULT 'candidature_offre' CHECK (submission_type IN ('candidature', 'offre', 'candidature_offre')),
ADD COLUMN IF NOT EXISTS procedure_other text,
ADD COLUMN IF NOT EXISTS dce_link text,
ADD COLUMN IF NOT EXISTS moa_company_id uuid REFERENCES public.crm_companies(id),
ADD COLUMN IF NOT EXISTS site_visit_assigned_user_id uuid,
ADD COLUMN IF NOT EXISTS pipeline_status text DEFAULT 'a_approuver' CHECK (pipeline_status IN ('a_approuver', 'en_cours', 'deposes'));

-- Create table for required MOE team specialties
CREATE TABLE IF NOT EXISTS public.tender_required_team (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  specialty text NOT NULL,
  is_mandatory boolean DEFAULT true,
  notes text,
  company_id uuid REFERENCES public.crm_companies(id),
  created_at timestamp with time zone DEFAULT now(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE
);

-- Enable RLS on the new table
ALTER TABLE public.tender_required_team ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tender_required_team
CREATE POLICY "Users can view tender required team in their workspace"
ON public.tender_required_team
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tender required team in their workspace"
ON public.tender_required_team
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tender required team in their workspace"
ON public.tender_required_team
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tender required team in their workspace"
ON public.tender_required_team
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tender_required_team_tender_id ON public.tender_required_team(tender_id);
CREATE INDEX IF NOT EXISTS idx_tenders_pipeline_status ON public.tenders(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_tenders_moa_company_id ON public.tenders(moa_company_id);