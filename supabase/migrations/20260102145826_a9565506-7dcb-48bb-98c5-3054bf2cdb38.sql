-- Create table for meeting report versions
CREATE TABLE public.meeting_report_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.project_meetings(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  attendees JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.meeting_report_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view versions in their workspace" 
ON public.meeting_report_versions 
FOR SELECT 
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can create versions in their workspace" 
ON public.meeting_report_versions 
FOR INSERT 
WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Create index for faster queries
CREATE INDEX idx_meeting_versions_meeting_id ON public.meeting_report_versions(meeting_id);
CREATE INDEX idx_meeting_versions_created_at ON public.meeting_report_versions(created_at DESC);