-- Add is_resolved column to feedback_entries
ALTER TABLE public.feedback_entries 
ADD COLUMN is_resolved BOOLEAN DEFAULT false;