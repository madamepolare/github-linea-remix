-- Create storage bucket for workspace assets (logos, signatures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their workspace folder
CREATE POLICY "Users can upload workspace assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Public can view workspace assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-assets');

-- Allow users to update their uploads
CREATE POLICY "Users can update workspace assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'workspace-assets' AND auth.role() = 'authenticated');

-- Allow users to delete their uploads
CREATE POLICY "Users can delete workspace assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'workspace-assets' AND auth.role() = 'authenticated');