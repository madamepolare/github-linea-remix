-- Add title column to task_exchanges
ALTER TABLE public.task_exchanges ADD COLUMN IF NOT EXISTS title TEXT;