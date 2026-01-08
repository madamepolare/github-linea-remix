-- Ajouter une colonne pour le suivi de complétion par membre du groupement
ALTER TABLE public.tender_deliverables 
ADD COLUMN IF NOT EXISTS member_completion JSONB DEFAULT '{}';

-- Ajouter un commentaire pour documenter la structure
COMMENT ON COLUMN public.tender_deliverables.member_completion IS 'Structure: { "company_id_1": true, "company_id_2": false, ... } - Suivi de complétion par membre du groupement';