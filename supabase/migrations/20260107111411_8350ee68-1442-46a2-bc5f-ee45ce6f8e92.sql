-- Table pour stocker les créneaux de planification des tâches
CREATE TABLE public.task_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Planning temporel
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  
  -- Métadonnées
  is_locked BOOLEAN DEFAULT false,
  notes TEXT,
  color TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte : une tâche ne peut être planifiée qu'une fois par utilisateur
  CONSTRAINT unique_task_user_schedule UNIQUE(task_id, user_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_task_schedules_workspace ON task_schedules(workspace_id);
CREATE INDEX idx_task_schedules_user ON task_schedules(user_id);
CREATE INDEX idx_task_schedules_task ON task_schedules(task_id);
CREATE INDEX idx_task_schedules_dates ON task_schedules(start_datetime, end_datetime);

-- Trigger pour updated_at
CREATE TRIGGER update_task_schedules_updated_at
  BEFORE UPDATE ON task_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.task_schedules ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : membres du workspace
CREATE POLICY "Members can view schedules in their workspace"
  ON task_schedules FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Politique d'insertion : membres du workspace
CREATE POLICY "Members can create schedules in their workspace"
  ON task_schedules FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Politique de modification : créateur, admin, ou propriétaire du créneau
CREATE POLICY "Users can update their schedules or admins"
  ON task_schedules FOR UPDATE
  USING (
    created_by = auth.uid()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.workspace_id = task_schedules.workspace_id
      AND role IN ('admin', 'owner')
    )
  );

-- Politique de suppression : créateur, admin, ou propriétaire du créneau
CREATE POLICY "Users can delete their schedules or admins"
  ON task_schedules FOR DELETE
  USING (
    created_by = auth.uid()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.workspace_id = task_schedules.workspace_id
      AND role IN ('admin', 'owner')
    )
  );