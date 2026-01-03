-- Create a dedicated table for meeting reports (CR - Comptes Rendus)
CREATE TABLE public.meeting_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.project_meetings(id) ON DELETE SET NULL,
  report_number INTEGER,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'validated', 'sent')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_data JSONB,
  pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_meeting_reports_project ON public.meeting_reports(project_id);
CREATE INDEX idx_meeting_reports_meeting ON public.meeting_reports(meeting_id);
CREATE INDEX idx_meeting_reports_workspace ON public.meeting_reports(workspace_id);

-- Enable RLS
ALTER TABLE public.meeting_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can manage reports in their workspace
CREATE POLICY "Users can view reports in their workspace"
ON public.meeting_reports
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create reports in their workspace"
ON public.meeting_reports
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update reports in their workspace"
ON public.meeting_reports
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete reports in their workspace"
ON public.meeting_reports
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_reports_updated_at
BEFORE UPDATE ON public.meeting_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing report_data from project_meetings to meeting_reports
INSERT INTO public.meeting_reports (project_id, workspace_id, meeting_id, report_number, title, status, report_date, report_data, pdf_url, created_by, created_at, updated_at)
SELECT 
  pm.project_id,
  pm.workspace_id,
  pm.id as meeting_id,
  pm.meeting_number as report_number,
  CONCAT('CR n°', pm.meeting_number, ' - ', pm.title) as title,
  'validated' as status,
  pm.meeting_date::date as report_date,
  pm.report_data,
  pm.pdf_url,
  pm.created_by,
  pm.created_at,
  pm.updated_at
FROM public.project_meetings pm
WHERE pm.report_data IS NOT NULL;