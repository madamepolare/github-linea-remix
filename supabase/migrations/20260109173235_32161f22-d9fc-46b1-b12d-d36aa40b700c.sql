-- Add is_internal field to projects table
ALTER TABLE public.projects 
ADD COLUMN is_internal boolean NOT NULL DEFAULT false;

-- Add index for filtering internal projects
CREATE INDEX idx_projects_is_internal ON public.projects(is_internal);

-- Comment for documentation
COMMENT ON COLUMN public.projects.is_internal IS 'True if this is an internal (non-billable) project like Admin, Training, etc.';