-- Create storage bucket for apprentice calendars
INSERT INTO storage.buckets (id, name, public)
VALUES ('apprentice-calendars', 'apprentice-calendars', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for apprentice calendars bucket
CREATE POLICY "Users can upload apprentice calendars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'apprentice-calendars' 
  AND EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can view apprentice calendars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'apprentice-calendars'
  AND EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete apprentice calendars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'apprentice-calendars'
  AND EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  )
);