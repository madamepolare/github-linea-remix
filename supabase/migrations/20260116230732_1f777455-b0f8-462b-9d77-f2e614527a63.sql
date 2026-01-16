-- Add favicon_url column to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN favicon_url TEXT NULL;