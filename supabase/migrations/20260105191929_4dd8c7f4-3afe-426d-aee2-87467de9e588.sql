-- ===========================================
-- PHASE 1: References (Portfolio) Tables
-- ===========================================

-- Table principale des références
CREATE TABLE public.project_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text,
  description text,
  client_name text,
  client_type text CHECK (client_type IN ('prive', 'public', 'promoteur', 'association')),
  project_type text CHECK (project_type IN ('architecture', 'interior', 'scenography', 'urban', 'landscape')),
  building_type text,
  surface_m2 numeric,
  budget_range text,
  completion_date date,
  location text,
  country text DEFAULT 'France',
  awards text[] DEFAULT '{}',
  press_mentions text[] DEFAULT '{}',
  collaborators text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Images de la référence
CREATE TABLE public.reference_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.project_references(id) ON DELETE CASCADE,
  storage_path text,
  url text,
  caption text,
  credits text,
  is_cover boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Équipe projet pour la référence
CREATE TABLE public.reference_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.project_references(id) ON DELETE CASCADE,
  role text NOT NULL,
  company_name text,
  crm_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- PHASE 2: Materials Library Tables
-- ===========================================

-- Catégories de matériaux (hiérarchique)
CREATE TABLE public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.material_categories(id) ON DELETE SET NULL,
  icon text,
  color text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Matériaux
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.material_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  reference text,
  manufacturer text,
  supplier_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  supplier_name text,
  description text,
  specifications jsonb DEFAULT '{}',
  dimensions jsonb,
  weight numeric,
  weight_unit text DEFAULT 'kg',
  price_unit numeric,
  price_currency text DEFAULT 'EUR',
  unit text DEFAULT 'unité',
  lead_time_days integer,
  min_order_quantity numeric,
  images text[] DEFAULT '{}',
  documents text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  sustainability_score integer CHECK (sustainability_score BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Liaison matériaux-projets
CREATE TABLE public.project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity numeric,
  unit text,
  location_notes text,
  status text DEFAULT 'specified' CHECK (status IN ('specified', 'ordered', 'delivered', 'installed')),
  supplier_quote numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- PHASE 3: Permits & Authorizations Tables
-- ===========================================

-- Permis et autorisations
CREATE TABLE public.project_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  permit_type text NOT NULL CHECK (permit_type IN ('pc', 'dp', 'pa', 'pd', 'at', 'erp', 'abf', 'icpe', 'other')),
  custom_type text,
  reference_number text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'preparing', 'submitted', 'pending', 'additional_info_requested', 'granted', 'rejected', 'expired', 'withdrawn')),
  preparation_start_date date,
  submission_date date,
  acknowledgment_date date,
  expected_response_date date,
  actual_response_date date,
  granted_date date,
  validity_end_date date,
  work_start_deadline date,
  authority_name text,
  authority_address text,
  authority_contact text,
  authority_email text,
  authority_phone text,
  surface_plancher numeric,
  construction_type text,
  conditions text,
  prescriptions text[] DEFAULT '{}',
  reserves text[] DEFAULT '{}',
  documents text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jalons du permis
CREATE TABLE public.permit_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.project_permits(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  completed_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  documents text[] DEFAULT '{}',
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- PHASE 4: Project Insurances Tables
-- ===========================================

CREATE TABLE public.project_insurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  insurance_type text NOT NULL CHECK (insurance_type IN ('decennale', 'do', 'rc_pro', 'trc', 'cns', 'puc', 'other')),
  custom_type text,
  insurer_name text NOT NULL,
  insurer_contact text,
  insurer_email text,
  insurer_phone text,
  broker_name text,
  broker_contact text,
  policy_number text,
  start_date date,
  end_date date,
  coverage_amount numeric,
  deductible numeric,
  premium numeric,
  premium_frequency text DEFAULT 'annual' CHECK (premium_frequency IN ('annual', 'monthly', 'quarterly')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  attestation_url text,
  documents text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- PHASE 5: Enrich Projects Table
-- ===========================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS surfaces jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fee_calculation jsonb DEFAULT '{}';

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- References
ALTER TABLE public.project_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workspace references" ON public.project_references
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage reference images" ON public.reference_images
  FOR ALL USING (reference_id IN (
    SELECT id FROM public.project_references WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage reference team" ON public.reference_team_members
  FOR ALL USING (reference_id IN (
    SELECT id FROM public.project_references WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  ));

-- Materials
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can manage categories" ON public.material_categories
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Workspace members can manage materials" ON public.materials
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage project materials" ON public.project_materials
  FOR ALL USING (project_id IN (
    SELECT id FROM public.projects WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  ));

-- Permits
ALTER TABLE public.project_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can manage permits" ON public.project_permits
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage milestones" ON public.permit_milestones
  FOR ALL USING (permit_id IN (
    SELECT id FROM public.project_permits WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  ));

-- Insurances
ALTER TABLE public.project_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can manage insurances" ON public.project_insurances
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ));

-- ===========================================
-- Updated_at Triggers
-- ===========================================

CREATE TRIGGER update_project_references_updated_at
  BEFORE UPDATE ON public.project_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_permits_updated_at
  BEFORE UPDATE ON public.project_permits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_insurances_updated_at
  BEFORE UPDATE ON public.project_insurances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();