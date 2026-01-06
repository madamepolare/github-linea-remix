-- Add recurrence support to project_calendar_events
ALTER TABLE public.project_calendar_events 
ADD COLUMN IF NOT EXISTS recurrence_rule text,
ADD COLUMN IF NOT EXISTS recurrence_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS parent_event_id uuid REFERENCES public.project_calendar_events(id) ON DELETE CASCADE;

-- Index for parent event lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent ON public.project_calendar_events(parent_event_id) WHERE parent_event_id IS NOT NULL;

COMMENT ON COLUMN public.project_calendar_events.recurrence_rule IS 'Recurrence frequency: weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN public.project_calendar_events.recurrence_end_date IS 'End date for recurring events';
COMMENT ON COLUMN public.project_calendar_events.parent_event_id IS 'Reference to parent event for recurring instances';