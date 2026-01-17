-- Create a function to sync deliverables to calendar events
CREATE OR REPLACE FUNCTION public.sync_deliverable_to_calendar()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_workspace_id UUID;
  v_deliverable_name TEXT;
  v_due_date TIMESTAMPTZ;
  v_phase_name TEXT;
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_project_id := NEW.project_id;
    v_workspace_id := NEW.workspace_id;
    v_deliverable_name := NEW.name;
    v_due_date := NEW.due_date;
    
    -- Get phase name if exists
    IF NEW.phase_id IS NOT NULL THEN
      SELECT name INTO v_phase_name FROM public.project_phases WHERE id = NEW.phase_id;
    END IF;
    
    -- If due_date exists, upsert calendar event
    IF v_due_date IS NOT NULL THEN
      -- Try to update existing event first
      UPDATE public.project_calendar_events
      SET 
        title = 'Rendu: ' || v_deliverable_name,
        description = COALESCE('Phase: ' || v_phase_name, '') || COALESCE(E'\n' || NEW.description, ''),
        start_datetime = v_due_date,
        end_datetime = v_due_date + INTERVAL '1 hour',
        updated_at = now()
      WHERE deliverable_id = NEW.id;
      
      -- If no row was updated, insert a new one
      IF NOT FOUND THEN
        INSERT INTO public.project_calendar_events (
          project_id,
          workspace_id,
          deliverable_id,
          title,
          description,
          event_type,
          start_datetime,
          end_datetime,
          is_all_day
        ) VALUES (
          v_project_id,
          v_workspace_id,
          NEW.id,
          'Rendu: ' || v_deliverable_name,
          COALESCE('Phase: ' || v_phase_name, '') || COALESCE(E'\n' || NEW.description, ''),
          'rendu',
          v_due_date,
          v_due_date + INTERVAL '1 hour',
          false
        );
      END IF;
    ELSE
      -- If due_date is removed, delete the calendar event
      DELETE FROM public.project_calendar_events WHERE deliverable_id = NEW.id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE - cascade will handle this via FK, but explicit for clarity
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.project_calendar_events WHERE deliverable_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for deliverables sync
DROP TRIGGER IF EXISTS sync_deliverable_calendar_trigger ON public.project_deliverables;
CREATE TRIGGER sync_deliverable_calendar_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.project_deliverables
FOR EACH ROW
EXECUTE FUNCTION public.sync_deliverable_to_calendar();

-- Sync existing deliverables to calendar (one-time migration)
INSERT INTO public.project_calendar_events (
  project_id,
  workspace_id,
  deliverable_id,
  title,
  description,
  event_type,
  start_datetime,
  end_datetime,
  is_all_day
)
SELECT 
  d.project_id,
  d.workspace_id,
  d.id,
  'Rendu: ' || d.name,
  COALESCE('Phase: ' || p.name, '') || COALESCE(E'\n' || d.description, ''),
  'rendu',
  d.due_date,
  d.due_date + INTERVAL '1 hour',
  false
FROM public.project_deliverables d
LEFT JOIN public.project_phases p ON d.phase_id = p.id
WHERE d.due_date IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.project_calendar_events e WHERE e.deliverable_id = d.id
);