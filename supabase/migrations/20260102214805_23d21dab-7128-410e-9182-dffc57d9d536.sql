-- Add construction budget fields to commercial_documents
ALTER TABLE public.commercial_documents
ADD COLUMN IF NOT EXISTS construction_budget numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS construction_budget_disclosed boolean DEFAULT true;

-- Create commercial document versions table for history
CREATE TABLE IF NOT EXISTS public.commercial_document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  document_snapshot jsonb NOT NULL,
  phases_snapshot jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  notes text
);

-- Enable RLS
ALTER TABLE public.commercial_document_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for versions
CREATE POLICY "Users can view versions in their workspace"
ON public.commercial_document_versions
FOR SELECT
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can create versions in their workspace"
ON public.commercial_document_versions
FOR INSERT
WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can delete versions in their workspace"
ON public.commercial_document_versions
FOR DELETE
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_commercial_doc_versions_document_id ON public.commercial_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_commercial_doc_versions_workspace_id ON public.commercial_document_versions(workspace_id);