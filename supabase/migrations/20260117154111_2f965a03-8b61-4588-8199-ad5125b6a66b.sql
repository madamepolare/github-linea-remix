-- Drop and recreate the function to check deliverable completion including subtasks
CREATE OR REPLACE FUNCTION public.check_deliverable_tasks_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deliverable_id uuid;
  v_main_task_id uuid;
  v_total_subtasks integer;
  v_done_subtasks integer;
  v_current_status text;
BEGIN
  -- Get the deliverable_id from the affected task
  IF TG_OP = 'DELETE' THEN
    v_deliverable_id := OLD.deliverable_id;
    -- If this is a subtask, find parent's deliverable_id
    IF v_deliverable_id IS NULL AND OLD.parent_id IS NOT NULL THEN
      SELECT deliverable_id INTO v_deliverable_id
      FROM public.tasks
      WHERE id = OLD.parent_id;
    END IF;
  ELSE
    v_deliverable_id := NEW.deliverable_id;
    -- If this is a subtask, find parent's deliverable_id
    IF v_deliverable_id IS NULL AND NEW.parent_id IS NOT NULL THEN
      SELECT deliverable_id INTO v_deliverable_id
      FROM public.tasks
      WHERE id = NEW.parent_id;
    END IF;
  END IF;
  
  -- If no deliverable linked, do nothing
  IF v_deliverable_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Find the main task linked to this deliverable
  SELECT id INTO v_main_task_id
  FROM public.tasks
  WHERE deliverable_id = v_deliverable_id
    AND parent_id IS NULL
  LIMIT 1;
  
  -- If no main task found, do nothing
  IF v_main_task_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Count total and completed SUBTASKS for the main task
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done')
  INTO v_total_subtasks, v_done_subtasks
  FROM public.tasks
  WHERE parent_id = v_main_task_id;
  
  -- Get current deliverable status
  SELECT status INTO v_current_status
  FROM public.project_deliverables
  WHERE id = v_deliverable_id;
  
  -- If all subtasks are done and there's at least one subtask, update to ready_to_send
  IF v_total_subtasks > 0 AND v_done_subtasks = v_total_subtasks THEN
    -- Only update if not already delivered or validated
    IF v_current_status NOT IN ('delivered', 'validated', 'ready_to_send') THEN
      UPDATE public.project_deliverables
      SET status = 'ready_to_send', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  ELSIF v_total_subtasks > 0 AND v_done_subtasks > 0 THEN
    -- Some subtasks done, set to in_progress if still pending
    IF v_current_status = 'pending' THEN
      UPDATE public.project_deliverables
      SET status = 'in_progress', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  ELSIF v_total_subtasks > 0 AND v_done_subtasks = 0 THEN
    -- No subtasks done, revert to pending if was ready_to_send or in_progress
    IF v_current_status IN ('ready_to_send', 'in_progress') THEN
      UPDATE public.project_deliverables
      SET status = 'pending', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Recreate trigger to also fire on parent_id changes
DROP TRIGGER IF EXISTS trigger_check_deliverable_tasks ON public.tasks;
CREATE TRIGGER trigger_check_deliverable_tasks
  AFTER INSERT OR UPDATE OF status, deliverable_id, parent_id OR DELETE
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_deliverable_tasks_completion();