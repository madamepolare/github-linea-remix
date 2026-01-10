-- Add notes column to commercial_documents
ALTER TABLE public.commercial_documents
ADD COLUMN IF NOT EXISTS notes TEXT;