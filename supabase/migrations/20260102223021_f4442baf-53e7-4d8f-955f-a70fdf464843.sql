-- Add category column to phase_templates
ALTER TABLE public.phase_templates 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'base';

-- Add comment for documentation
COMMENT ON COLUMN public.phase_templates.category IS 'Phase category: base for standard architect phases, complementary for additional missions like OPC';