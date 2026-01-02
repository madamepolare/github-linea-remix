-- Add report_data JSONB column to store structured report data for DET meetings
ALTER TABLE public.project_meetings 
ADD COLUMN IF NOT EXISTS report_data jsonb DEFAULT '{}';

-- Add comment to describe the structure
COMMENT ON COLUMN public.project_meetings.report_data IS 'Structured report data for DET meetings. Contains: context, general_progress, lot_progress, technical_decisions, blocking_points, planning, financial, sqe, documents, next_meeting, distribution_list, legal_mention, legal_delay_days';