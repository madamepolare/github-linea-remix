-- Create function to check and update deliverable status when tasks are updated
CREATE OR REPLACE FUNCTION public.check_deliverable_tasks_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_deliverable_id uuid;
  v_total_tasks integer;
  v_done_tasks integer;
  v_current_status text;
BEGIN
  -- Get the deliverable_id from the affected task
  IF TG_OP = 'DELETE' THEN
    v_deliverable_id := OLD.deliverable_id;
  ELSE
    v_deliverable_id := NEW.deliverable_id;
  END IF;
  
  -- If no deliverable linked, do nothing
  IF v_deliverable_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Count total and completed tasks for this deliverable
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done')
  INTO v_total_tasks, v_done_tasks
  FROM public.tasks
  WHERE deliverable_id = v_deliverable_id;
  
  -- Get current deliverable status
  SELECT status INTO v_current_status
  FROM public.project_deliverables
  WHERE id = v_deliverable_id;
  
  -- If all tasks are done and there's at least one task, update to ready_to_send
  IF v_total_tasks > 0 AND v_done_tasks = v_total_tasks THEN
    -- Only update if not already delivered or validated
    IF v_current_status NOT IN ('delivered', 'validated') THEN
      UPDATE public.project_deliverables
      SET status = 'ready_to_send', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  ELSIF v_total_tasks > 0 AND v_done_tasks > 0 THEN
    -- Some tasks done, set to in_progress if still pending
    IF v_current_status = 'pending' THEN
      UPDATE public.project_deliverables
      SET status = 'in_progress', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS trigger_check_deliverable_tasks ON public.tasks;
CREATE TRIGGER trigger_check_deliverable_tasks
  AFTER INSERT OR UPDATE OF status, deliverable_id OR DELETE
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_deliverable_tasks_completion();

-- Add ready_to_send status comment for documentation
COMMENT ON FUNCTION public.check_deliverable_tasks_completion IS 'Automatically updates deliverable status to ready_to_send when all linked tasks are completed';