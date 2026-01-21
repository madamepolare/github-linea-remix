-- Add completed_at column to track when task was marked as done
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of completed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON public.tasks(completed_at) 
WHERE status = 'done' AND completed_at IS NOT NULL;

-- Create function to auto-set completed_at when status changes to 'done'
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to 'done'
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Clear completed_at if task is reopened (status changed from 'done' to something else)
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-set completed_at
DROP TRIGGER IF EXISTS trigger_set_task_completed_at ON public.tasks;
CREATE TRIGGER trigger_set_task_completed_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_task_completed_at();

-- Backfill: set completed_at for existing done tasks (use updated_at as approximation)
UPDATE public.tasks 
SET completed_at = updated_at 
WHERE status = 'done' AND completed_at IS NULL;