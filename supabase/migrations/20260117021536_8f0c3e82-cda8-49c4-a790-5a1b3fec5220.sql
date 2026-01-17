-- Create junction table for multiple operational contacts on projects
CREATE TABLE public.project_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role text DEFAULT 'operational', -- operational, billing, decision_maker, etc.
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view project contacts in their workspace"
  ON public.project_contacts FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert project contacts in their workspace"
  ON public.project_contacts FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update project contacts in their workspace"
  ON public.project_contacts FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete project contacts in their workspace"
  ON public.project_contacts FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Index for performance
CREATE INDEX idx_project_contacts_project ON public.project_contacts(project_id);
CREATE INDEX idx_project_contacts_contact ON public.project_contacts(contact_id);
CREATE INDEX idx_project_contacts_workspace ON public.project_contacts(workspace_id);