-- Add deliverable_id to tasks table for tracking tasks created from deliverables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deliverable_id uuid REFERENCES public.project_deliverables(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deliverable_id ON public.tasks(deliverable_id);

-- Add deliverable_id to project_calendar_events for sync between deliverables and calendar
ALTER TABLE public.project_calendar_events ADD COLUMN IF NOT EXISTS deliverable_id uuid REFERENCES public.project_deliverables(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_calendar_events_deliverable_id ON public.project_calendar_events(deliverable_id);