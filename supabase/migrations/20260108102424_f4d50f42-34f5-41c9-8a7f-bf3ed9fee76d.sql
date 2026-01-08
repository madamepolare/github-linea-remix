-- Add parent_member_id to link subcontractors to their contractor
ALTER TABLE public.tender_team_members 
ADD COLUMN parent_member_id uuid REFERENCES public.tender_team_members(id) ON DELETE SET NULL;

-- Add fee_percentage for financial tracking
ALTER TABLE public.tender_team_members 
ADD COLUMN fee_percentage numeric;

-- Add index for parent lookup
CREATE INDEX idx_tender_team_members_parent ON public.tender_team_members(parent_member_id) WHERE parent_member_id IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.tender_team_members.parent_member_id IS 'For subcontractors: links to the team member (mandataire or cotraitant) they work for';