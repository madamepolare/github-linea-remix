-- Add tender_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_tasks_tender_id ON public.tasks(tender_id);

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.tender_id IS 'Reference to the tender this task is associated with';