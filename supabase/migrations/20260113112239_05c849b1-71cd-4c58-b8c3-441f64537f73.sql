-- Add critical_alerts column to tenders table
-- This will store alerts extracted from DCE analysis for display in Synthèse view
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS critical_alerts JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.tenders.critical_alerts IS 'Critical alerts extracted from DCE analysis. Format: [{type, message, severity, source}]';