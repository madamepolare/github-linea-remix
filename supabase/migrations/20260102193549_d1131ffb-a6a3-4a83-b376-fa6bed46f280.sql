-- Table for interventions (specific work periods within lots)
CREATE TABLE public.project_lot_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES public.project_lots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  color TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed', 'cancelled')),
  team_size INTEGER DEFAULT 1,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_lot_interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view interventions in their workspace"
ON public.project_lot_interventions
FOR SELECT
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can create interventions in their workspace"
ON public.project_lot_interventions
FOR INSERT
WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can update interventions in their workspace"
ON public.project_lot_interventions
FOR UPDATE
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can delete interventions in their workspace"
ON public.project_lot_interventions
FOR DELETE
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Index for performance
CREATE INDEX idx_interventions_project ON public.project_lot_interventions(project_id);
CREATE INDEX idx_interventions_lot ON public.project_lot_interventions(lot_id);
CREATE INDEX idx_interventions_dates ON public.project_lot_interventions(start_date, end_date);

-- Trigger for updated_at
CREATE TRIGGER update_interventions_updated_at
BEFORE UPDATE ON public.project_lot_interventions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();