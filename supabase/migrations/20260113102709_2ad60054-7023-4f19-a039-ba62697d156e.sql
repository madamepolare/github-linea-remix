-- Table pour gérer les disciplines actives par workspace
CREATE TABLE public.workspace_disciplines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  discipline_slug TEXT NOT NULL CHECK (discipline_slug IN ('architecture', 'scenographie', 'communication')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, discipline_slug)
);

-- Indexes
CREATE INDEX idx_workspace_disciplines_workspace ON public.workspace_disciplines(workspace_id);
CREATE INDEX idx_workspace_disciplines_active ON public.workspace_disciplines(workspace_id, is_active);

-- Enable RLS
ALTER TABLE public.workspace_disciplines ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their workspace disciplines"
ON public.workspace_disciplines
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_disciplines.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage workspace disciplines"
ON public.workspace_disciplines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_disciplines.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_workspace_disciplines_updated_at
  BEFORE UPDATE ON public.workspace_disciplines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();