-- =====================================================
-- SYSTÈME DE PERMISSIONS MODIFIABLE
-- =====================================================

-- 1. Table des permissions disponibles
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  sort_order integer DEFAULT 0,
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Table des permissions par rôle (modifiable par workspace)
CREATE TABLE IF NOT EXISTS public.workspace_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  permission_code text NOT NULL,
  granted boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, role, permission_code)
);

-- 3. Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for permissions (read-only for all)
CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

-- 5. RLS Policies for workspace_role_permissions
CREATE POLICY "Workspace members can view role permissions"
ON public.workspace_role_permissions FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage role permissions"
ON public.workspace_role_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.workspace_id = workspace_role_permissions.workspace_id
    AND user_roles.role IN ('owner', 'admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.user_id = auth.uid() 
    AND workspace_members.workspace_id = workspace_role_permissions.workspace_id
    AND workspace_members.role IN ('owner', 'admin')
  )
);

-- 6. Function to check permission with workspace customization
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id uuid,
  _workspace_id uuid,
  _permission_code text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
  _custom_grant boolean;
  _default_roles app_role[] := CASE _permission_code
    -- Projects
    WHEN 'projects.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'projects.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'projects.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'projects.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'projects.archive' THEN ARRAY['owner', 'admin']::app_role[]
    -- CRM
    WHEN 'crm.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'crm.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'crm.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'crm.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'crm.view_sensitive' THEN ARRAY['owner', 'admin']::app_role[]
    -- Commercial
    WHEN 'commercial.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'commercial.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'commercial.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'commercial.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'commercial.send' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'commercial.sign' THEN ARRAY['owner', 'admin']::app_role[]
    -- Invoicing
    WHEN 'invoicing.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'invoicing.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'invoicing.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'invoicing.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'invoicing.send' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'invoicing.mark_paid' THEN ARRAY['owner', 'admin']::app_role[]
    -- Documents
    WHEN 'documents.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'documents.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'documents.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'documents.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'documents.sign' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    -- Tasks
    WHEN 'tasks.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'tasks.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'tasks.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'tasks.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'tasks.assign' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    -- Tenders
    WHEN 'tenders.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'tenders.create' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'tenders.edit' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'tenders.delete' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'tenders.submit' THEN ARRAY['owner', 'admin']::app_role[]
    -- Team
    WHEN 'team.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'team.invite' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.manage_roles' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.remove' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.view_time' THEN ARRAY['owner', 'admin', 'member']::app_role[]
    WHEN 'team.validate_time' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.manage_absences' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.manage_evaluations' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'team.manage_recruitment' THEN ARRAY['owner', 'admin']::app_role[]
    -- Settings
    WHEN 'settings.view' THEN ARRAY['owner', 'admin', 'member', 'viewer']::app_role[]
    WHEN 'settings.edit' THEN ARRAY['owner', 'admin']::app_role[]
    WHEN 'settings.manage_workspace' THEN ARRAY['owner']::app_role[]
    WHEN 'settings.manage_billing' THEN ARRAY['owner']::app_role[]
    ELSE ARRAY[]::app_role[]
  END;
BEGIN
  -- Get user's role in this workspace
  SELECT role INTO _user_role
  FROM user_roles
  WHERE user_id = _user_id AND workspace_id = _workspace_id;
  
  -- Fallback to workspace_members
  IF _user_role IS NULL THEN
    SELECT role INTO _user_role
    FROM workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id;
  END IF;
  
  IF _user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for workspace-specific override
  SELECT granted INTO _custom_grant
  FROM workspace_role_permissions
  WHERE workspace_id = _workspace_id 
    AND role = _user_role 
    AND permission_code = _permission_code;
  
  -- If custom override exists, use it
  IF _custom_grant IS NOT NULL THEN
    RETURN _custom_grant;
  END IF;
  
  -- Otherwise use default matrix
  RETURN _user_role = ANY(_default_roles);
END;
$$;

-- 7. Seed default permissions
INSERT INTO public.permissions (code, name, description, category, sort_order) VALUES
-- Projects
('projects.view', 'Voir les projets', 'Consulter la liste et les détails des projets', 'projects', 1),
('projects.create', 'Créer des projets', 'Créer de nouveaux projets', 'projects', 2),
('projects.edit', 'Modifier les projets', 'Modifier les informations des projets', 'projects', 3),
('projects.delete', 'Supprimer des projets', 'Supprimer définitivement des projets', 'projects', 4),
('projects.archive', 'Archiver des projets', 'Archiver/désarchiver des projets', 'projects', 5),
-- CRM
('crm.view', 'Voir le CRM', 'Consulter les contacts et entreprises', 'crm', 1),
('crm.create', 'Créer dans le CRM', 'Ajouter des contacts et entreprises', 'crm', 2),
('crm.edit', 'Modifier le CRM', 'Modifier les fiches contacts et entreprises', 'crm', 3),
('crm.delete', 'Supprimer du CRM', 'Supprimer des contacts et entreprises', 'crm', 4),
('crm.view_sensitive', 'Données sensibles CRM', 'Voir les emails, téléphones, notes privées', 'crm', 5),
-- Commercial
('commercial.view', 'Voir les devis', 'Consulter les devis et propositions', 'commercial', 1),
('commercial.create', 'Créer des devis', 'Créer de nouveaux devis', 'commercial', 2),
('commercial.edit', 'Modifier les devis', 'Modifier les devis existants', 'commercial', 3),
('commercial.delete', 'Supprimer des devis', 'Supprimer des devis', 'commercial', 4),
('commercial.send', 'Envoyer des devis', 'Envoyer des devis aux clients', 'commercial', 5),
('commercial.sign', 'Signer des devis', 'Valider et signer des devis', 'commercial', 6),
-- Invoicing
('invoicing.view', 'Voir les factures', 'Consulter les factures', 'invoicing', 1),
('invoicing.create', 'Créer des factures', 'Créer de nouvelles factures', 'invoicing', 2),
('invoicing.edit', 'Modifier les factures', 'Modifier les factures existantes', 'invoicing', 3),
('invoicing.delete', 'Supprimer des factures', 'Supprimer des factures', 'invoicing', 4),
('invoicing.send', 'Envoyer des factures', 'Envoyer des factures aux clients', 'invoicing', 5),
('invoicing.mark_paid', 'Marquer comme payé', 'Marquer une facture comme payée', 'invoicing', 6),
-- Documents
('documents.view', 'Voir les documents', 'Consulter les documents', 'documents', 1),
('documents.create', 'Créer des documents', 'Créer de nouveaux documents', 'documents', 2),
('documents.edit', 'Modifier les documents', 'Modifier les documents existants', 'documents', 3),
('documents.delete', 'Supprimer des documents', 'Supprimer des documents', 'documents', 4),
('documents.sign', 'Signer des documents', 'Signer électroniquement des documents', 'documents', 5),
-- Tasks
('tasks.view', 'Voir les tâches', 'Consulter les tâches', 'tasks', 1),
('tasks.create', 'Créer des tâches', 'Créer de nouvelles tâches', 'tasks', 2),
('tasks.edit', 'Modifier les tâches', 'Modifier les tâches existantes', 'tasks', 3),
('tasks.delete', 'Supprimer des tâches', 'Supprimer des tâches', 'tasks', 4),
('tasks.assign', 'Assigner des tâches', 'Assigner des tâches à des membres', 'tasks', 5),
-- Tenders
('tenders.view', 'Voir les appels d''offres', 'Consulter les appels d''offres', 'tenders', 1),
('tenders.create', 'Créer des appels d''offres', 'Créer de nouveaux appels d''offres', 'tenders', 2),
('tenders.edit', 'Modifier les appels d''offres', 'Modifier les appels d''offres existants', 'tenders', 3),
('tenders.delete', 'Supprimer des appels d''offres', 'Supprimer des appels d''offres', 'tenders', 4),
('tenders.submit', 'Soumettre des appels d''offres', 'Soumettre la candidature', 'tenders', 5),
-- Team
('team.view', 'Voir l''équipe', 'Consulter les membres de l''équipe', 'team', 1),
('team.invite', 'Inviter des membres', 'Inviter de nouveaux membres', 'team', 2),
('team.manage_roles', 'Gérer les rôles', 'Modifier les rôles des membres', 'team', 3),
('team.remove', 'Retirer des membres', 'Retirer des membres de l''équipe', 'team', 4),
('team.view_time', 'Voir le temps', 'Consulter le suivi du temps', 'team', 5),
('team.validate_time', 'Valider le temps', 'Valider les entrées de temps', 'team', 6),
('team.manage_absences', 'Gérer les absences', 'Gérer les congés et absences', 'team', 7),
('team.manage_evaluations', 'Gérer les entretiens', 'Gérer les évaluations', 'team', 8),
('team.manage_recruitment', 'Gérer le recrutement', 'Gérer le processus de recrutement', 'team', 9),
-- Settings
('settings.view', 'Voir les paramètres', 'Consulter les paramètres', 'settings', 1),
('settings.edit', 'Modifier les paramètres', 'Modifier les paramètres généraux', 'settings', 2),
('settings.manage_workspace', 'Gérer le workspace', 'Gérer la configuration du workspace', 'settings', 3),
('settings.manage_billing', 'Gérer la facturation', 'Gérer l''abonnement et les paiements', 'settings', 4)
ON CONFLICT (code) DO NOTHING;

-- 8. Create index for performance
CREATE INDEX IF NOT EXISTS idx_workspace_role_permissions_lookup 
ON workspace_role_permissions(workspace_id, role, permission_code);

CREATE INDEX IF NOT EXISTS idx_permissions_category 
ON permissions(category);