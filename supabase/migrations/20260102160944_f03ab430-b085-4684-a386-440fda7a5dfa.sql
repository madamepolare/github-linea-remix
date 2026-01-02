-- Create storage bucket for observation files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'observation-files',
  'observation-files',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
);

-- RLS policies for observation files
CREATE POLICY "Workspace members can view observation files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'observation-files'
);

CREATE POLICY "Workspace members can upload observation files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'observation-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Workspace members can update their observation files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'observation-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Workspace members can delete observation files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'observation-files' 
  AND auth.role() = 'authenticated'
);