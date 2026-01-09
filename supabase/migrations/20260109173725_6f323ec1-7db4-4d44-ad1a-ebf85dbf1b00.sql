-- Add work_description field to task_schedules for tracking work done
ALTER TABLE public.task_schedules
ADD COLUMN work_description text;

-- Comment for documentation
COMMENT ON COLUMN public.task_schedules.work_description IS 'Description of the work actually done during this scheduled time slot';