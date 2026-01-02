-- Table pour les dépendances entre phases
CREATE TABLE public.phase_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  depends_on_phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(phase_id, depends_on_phase_id),
  CONSTRAINT no_self_dependency CHECK (phase_id != depends_on_phase_id)
);

-- Enable RLS
ALTER TABLE public.phase_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies - basées sur l'accès aux phases parentes
CREATE POLICY "Users can view phase dependencies in their workspace"
ON public.phase_dependencies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_phases pp
    JOIN public.projects p ON pp.project_id = p.id
    WHERE pp.id = phase_dependencies.phase_id
    AND p.workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
);

CREATE POLICY "Users can manage phase dependencies in their workspace"
ON public.phase_dependencies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.project_phases pp
    JOIN public.projects p ON pp.project_id = p.id
    WHERE pp.id = phase_dependencies.phase_id
    AND p.workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_phases pp
    JOIN public.projects p ON pp.project_id = p.id
    WHERE pp.id = phase_dependencies.phase_id
    AND p.workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  )
);