-- Add parent_id to task_comments for reply threads
ALTER TABLE public.task_comments 
ADD COLUMN parent_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE;

-- Add parent_id to task_exchanges for reply threads  
ALTER TABLE public.task_exchanges
ADD COLUMN parent_id UUID REFERENCES public.task_exchanges(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX idx_task_comments_parent_id ON public.task_comments(parent_id);
CREATE INDEX idx_task_exchanges_parent_id ON public.task_exchanges(parent_id);