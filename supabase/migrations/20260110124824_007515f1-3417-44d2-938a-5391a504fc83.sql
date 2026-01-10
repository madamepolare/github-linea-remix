-- Add builder_tabs configuration to contract_types
-- This stores which tabs are enabled for each contract type in the quote builder

ALTER TABLE public.contract_types
ADD COLUMN IF NOT EXISTS builder_tabs jsonb DEFAULT '["general", "lines", "terms"]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.contract_types.builder_tabs IS 'Array of enabled tabs for the quote builder: general, fees, lines, production, planning, terms';

-- Update existing contract types with appropriate default tabs based on their code
UPDATE public.contract_types
SET builder_tabs = CASE 
  WHEN code = 'ARCHI' THEN '["general", "fees", "planning", "terms"]'::jsonb
  WHEN code = 'INTERIOR' THEN '["general", "fees", "lines", "terms"]'::jsonb
  WHEN code = 'SCENO' THEN '["general", "lines", "production", "planning", "terms"]'::jsonb
  WHEN code IN ('PUB', 'BRAND', 'WEB') THEN '["general", "lines", "production", "terms"]'::jsonb
  ELSE '["general", "lines", "terms"]'::jsonb
END
WHERE builder_tabs IS NULL OR builder_tabs = '["general", "lines", "terms"]'::jsonb;