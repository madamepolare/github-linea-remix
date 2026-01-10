-- Add VAT configuration to companies (clients and suppliers)
ALTER TABLE public.crm_companies 
ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS vat_type text DEFAULT 'standard';

-- Comment for clarity
COMMENT ON COLUMN public.crm_companies.vat_rate IS 'TVA rate applicable (default 20%)';
COMMENT ON COLUMN public.crm_companies.vat_type IS 'Type of VAT: standard, reduced, super_reduced, exempt, intra_eu, export';

-- Add VAT override to commercial documents
ALTER TABLE public.commercial_documents 
ADD COLUMN IF NOT EXISTS vat_rate numeric,
ADD COLUMN IF NOT EXISTS vat_type text;

COMMENT ON COLUMN public.commercial_documents.vat_rate IS 'Override VAT rate for this document';
COMMENT ON COLUMN public.commercial_documents.vat_type IS 'Override VAT type for this document';