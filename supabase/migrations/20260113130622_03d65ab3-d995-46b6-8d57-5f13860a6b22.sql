-- Add fee management columns to tenders table
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS moe_fee_percentage numeric,
ADD COLUMN IF NOT EXISTS moe_phases jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS moe_fee_amount numeric;

-- Add comment for clarity
COMMENT ON COLUMN public.tenders.moe_fee_percentage IS 'Global MOE fee percentage for the tender';
COMMENT ON COLUMN public.tenders.moe_phases IS 'Array of phase codes included in the mission (e.g., ["ESQ", "APS", "APD", "PRO"])';
COMMENT ON COLUMN public.tenders.moe_fee_amount IS 'Calculated MOE fee amount based on budget and percentage';