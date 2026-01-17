-- Add fields for external team members to project_members table
ALTER TABLE public.project_members 
ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS external_contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS notes text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_external ON public.project_members(project_id) WHERE is_external = true;

-- Add contact_type to project_contacts to distinguish client team from other uses
ALTER TABLE public.project_contacts
ADD COLUMN IF NOT EXISTS contact_type text DEFAULT 'client';

-- Create index for filtering by type
CREATE INDEX IF NOT EXISTS idx_project_contacts_type ON public.project_contacts(project_id, contact_type);

-- Update existing project_contacts to have 'client' type (they are all client contacts)
UPDATE public.project_contacts SET contact_type = 'client' WHERE contact_type IS NULL;