-- Create bucket for signed documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signed-documents', 'signed-documents', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Public can read signed documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'signed-documents');

-- Create storage policy for service role upload
CREATE POLICY "Service role can upload signed documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'signed-documents');

-- Add pdf_url column to commercial_documents if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'commercial_documents' 
    AND column_name = 'signed_pdf_url'
  ) THEN
    ALTER TABLE public.commercial_documents ADD COLUMN signed_pdf_url TEXT;
  END IF;
END $$;