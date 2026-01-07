
-- Créer les types enum pour les éléments
CREATE TYPE public.element_type AS ENUM (
  'link',
  'file',
  'email',
  'note',
  'order',
  'letter',
  'other'
);

CREATE TYPE public.element_visibility AS ENUM (
  'all',
  'admin',
  'owner'
);

-- Table principale des éléments de projet
CREATE TABLE public.project_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Contenu
  title TEXT NOT NULL,
  description TEXT,
  element_type element_type NOT NULL DEFAULT 'file',
  
  -- Pour les liens
  url TEXT,
  
  -- Pour les fichiers
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- Métadonnées
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  visibility element_visibility NOT NULL DEFAULT 'all',
  is_pinned BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_project_elements_project ON project_elements(project_id);
CREATE INDEX idx_project_elements_workspace ON project_elements(workspace_id);
CREATE INDEX idx_project_elements_type ON project_elements(element_type);
CREATE INDEX idx_project_elements_created_by ON project_elements(created_by);

-- Trigger pour updated_at
CREATE TRIGGER update_project_elements_updated_at
  BEFORE UPDATE ON project_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.project_elements ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier si l'utilisateur peut voir un élément selon sa visibilité
CREATE OR REPLACE FUNCTION public.can_view_element(
  _element_visibility element_visibility,
  _element_workspace_id UUID,
  _element_created_by UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Le créateur peut toujours voir son élément
  IF _element_created_by = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Visibilité "all" = tout membre du workspace peut voir
  IF _element_visibility = 'all' THEN
    RETURN true;
  END IF;
  
  -- Récupérer le rôle de l'utilisateur dans le workspace
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
    AND workspace_id = _element_workspace_id
  LIMIT 1;
  
  -- Fallback sur workspace_members si user_roles est vide
  IF v_user_role IS NULL THEN
    SELECT role INTO v_user_role
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND workspace_id = _element_workspace_id
    LIMIT 1;
  END IF;
  
  -- Vérifier selon la visibilité requise
  IF _element_visibility = 'admin' AND v_user_role IN ('admin', 'owner') THEN
    RETURN true;
  END IF;
  
  IF _element_visibility = 'owner' AND v_user_role = 'owner' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Politique de lecture basée sur la visibilité
CREATE POLICY "Users can view elements based on visibility"
  ON project_elements FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    AND can_view_element(visibility, workspace_id, created_by)
  );

-- Politique d'insertion pour les membres
CREATE POLICY "Members can create elements"
  ON project_elements FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Politique de modification (créateur ou admin+)
CREATE POLICY "Creator or admin can update elements"
  ON project_elements FOR UPDATE
  USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND workspace_id = project_elements.workspace_id
      AND role IN ('admin', 'owner')
    )
    OR EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND workspace_id = project_elements.workspace_id
      AND role IN ('admin', 'owner')
    )
  );

-- Politique de suppression (créateur ou admin+)
CREATE POLICY "Creator or admin can delete elements"
  ON project_elements FOR DELETE
  USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND workspace_id = project_elements.workspace_id
      AND role IN ('admin', 'owner')
    )
    OR EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND workspace_id = project_elements.workspace_id
      AND role IN ('admin', 'owner')
    )
  );

-- Créer le bucket de stockage pour les fichiers d'éléments
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-elements', 'project-elements', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de lecture publique pour les fichiers
CREATE POLICY "Public read for project elements files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-elements');

-- Politique d'upload pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload project element files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-elements');

-- Politique de suppression pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete project element files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-elements');
