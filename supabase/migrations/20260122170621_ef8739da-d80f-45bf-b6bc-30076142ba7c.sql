-- Add pricing_mode column to commercial_document_phases
-- This column determines if the line uses percentage-based or fixed pricing
ALTER TABLE public.commercial_document_phases 
ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'fixed';

-- Add comment for documentation
COMMENT ON COLUMN public.commercial_document_phases.pricing_mode IS 'Pricing calculation mode: percentage (based on construction budget) or fixed (manual unit_price)';

-- Set existing phases with percentage_fee to percentage mode
UPDATE public.commercial_document_phases 
SET pricing_mode = 'percentage' 
WHERE percentage_fee IS NOT NULL AND percentage_fee > 0 AND line_type = 'phase';