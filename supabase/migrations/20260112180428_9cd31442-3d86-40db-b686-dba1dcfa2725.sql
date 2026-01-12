-- Add site_visit_notes field for notes about site visits (e.g., "visite obligatoire en phase 2")
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS site_visit_notes TEXT;