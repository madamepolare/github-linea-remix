-- Add discipline_slug column to tenders table to support multi-discipline architecture
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS discipline_slug TEXT DEFAULT 'architecture';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tenders_discipline_slug ON public.tenders(discipline_slug);

-- Add comment for documentation
COMMENT ON COLUMN public.tenders.discipline_slug IS 'Discipline identifier for loading discipline-specific configuration (architecture, communication, scenographie, etc.)';