-- Add credential support to project_elements table
ALTER TABLE public.project_elements 
ADD COLUMN IF NOT EXISTS credential_data JSONB,
ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false;

-- Drop the project_knowledge table that was created by mistake
DROP TABLE IF EXISTS public.project_knowledge;