-- ============================================
-- LINEA Multi-Discipline System - Phase 1
-- ============================================

-- 1. Create disciplines table
CREATE TABLE public.disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;

-- Public read access (disciplines are system-wide)
CREATE POLICY "Disciplines are viewable by everyone"
ON public.disciplines FOR SELECT
USING (true);

-- 2. Insert default disciplines
INSERT INTO public.disciplines (slug, name, description, icon, color, sort_order) VALUES
  ('architecture', 'Architecture', 'Projets de construction, réhabilitation, extension et permis de construire', 'Building2', 'hsl(220, 70%, 50%)', 1),
  ('interior', 'Architecture d''intérieur', 'Aménagement, retail, résidentiel et hospitality', 'Sofa', 'hsl(280, 70%, 50%)', 2),
  ('scenography', 'Scénographie', 'Expositions, muséographie, événementiel et stands', 'Theater', 'hsl(340, 70%, 50%)', 3),
  ('communication', 'Agence de Communication', 'Campagnes, branding, digital et événementiel', 'Megaphone', 'hsl(30, 70%, 50%)', 4);

-- 3. Add discipline_id to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN discipline_id uuid REFERENCES public.disciplines(id);

-- Set default discipline to 'architecture' for existing workspaces
UPDATE public.workspaces 
SET discipline_id = (SELECT id FROM public.disciplines WHERE slug = 'architecture')
WHERE discipline_id IS NULL;

-- 4. Create discipline_modules mapping table
CREATE TABLE public.discipline_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  is_available boolean DEFAULT true,
  is_recommended boolean DEFAULT false,
  is_default_enabled boolean DEFAULT false,
  custom_name text,
  custom_description text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(discipline_id, module_key)
);

-- Enable RLS
ALTER TABLE public.discipline_modules ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Discipline modules are viewable by everyone"
ON public.discipline_modules FOR SELECT
USING (true);

-- 5. Insert module mappings for each discipline
-- Get discipline IDs
DO $$
DECLARE
  arch_id uuid;
  interior_id uuid;
  sceno_id uuid;
  comm_id uuid;
BEGIN
  SELECT id INTO arch_id FROM public.disciplines WHERE slug = 'architecture';
  SELECT id INTO interior_id FROM public.disciplines WHERE slug = 'interior';
  SELECT id INTO sceno_id FROM public.disciplines WHERE slug = 'scenography';
  SELECT id INTO comm_id FROM public.disciplines WHERE slug = 'communication';

  -- Architecture modules
  INSERT INTO public.discipline_modules (discipline_id, module_key, is_available, is_recommended, is_default_enabled, sort_order) VALUES
    (arch_id, 'projects', true, true, true, 1),
    (arch_id, 'tasks', true, true, true, 2),
    (arch_id, 'crm', true, true, true, 3),
    (arch_id, 'documents', true, true, true, 4),
    (arch_id, 'tenders', true, true, true, 5),
    (arch_id, 'commercial', true, true, true, 6),
    (arch_id, 'construction', true, true, true, 7),
    (arch_id, 'time-tracking', true, false, false, 8),
    (arch_id, 'resources', true, false, false, 9),
    (arch_id, 'calendar', true, false, false, 10),
    (arch_id, 'references', true, false, false, 11),
    (arch_id, 'objects', false, false, false, 12),
    (arch_id, 'campaigns', false, false, false, 13),
    (arch_id, 'media-planning', false, false, false, 14);

  -- Interior design modules
  INSERT INTO public.discipline_modules (discipline_id, module_key, is_available, is_recommended, is_default_enabled, sort_order) VALUES
    (interior_id, 'projects', true, true, true, 1),
    (interior_id, 'tasks', true, true, true, 2),
    (interior_id, 'crm', true, true, true, 3),
    (interior_id, 'documents', true, true, true, 4),
    (interior_id, 'tenders', true, false, false, 5),
    (interior_id, 'commercial', true, true, true, 6),
    (interior_id, 'construction', true, true, false, 7),
    (interior_id, 'time-tracking', true, false, false, 8),
    (interior_id, 'resources', true, false, false, 9),
    (interior_id, 'calendar', true, false, false, 10),
    (interior_id, 'references', true, true, true, 11),
    (interior_id, 'objects', true, true, true, 12),
    (interior_id, 'campaigns', false, false, false, 13),
    (interior_id, 'media-planning', false, false, false, 14);

  -- Scenography modules
  INSERT INTO public.discipline_modules (discipline_id, module_key, is_available, is_recommended, is_default_enabled, sort_order) VALUES
    (sceno_id, 'projects', true, true, true, 1),
    (sceno_id, 'tasks', true, true, true, 2),
    (sceno_id, 'crm', true, true, true, 3),
    (sceno_id, 'documents', true, true, true, 4),
    (sceno_id, 'tenders', true, true, true, 5),
    (sceno_id, 'commercial', true, true, true, 6),
    (sceno_id, 'construction', false, false, false, 7),
    (sceno_id, 'time-tracking', true, false, false, 8),
    (sceno_id, 'resources', true, true, false, 9),
    (sceno_id, 'calendar', true, false, false, 10),
    (sceno_id, 'references', true, true, true, 11),
    (sceno_id, 'objects', true, true, false, 12),
    (sceno_id, 'campaigns', false, false, false, 13),
    (sceno_id, 'media-planning', false, false, false, 14);

  -- Communication agency modules
  INSERT INTO public.discipline_modules (discipline_id, module_key, is_available, is_recommended, is_default_enabled, sort_order) VALUES
    (comm_id, 'projects', true, true, true, 1),
    (comm_id, 'tasks', true, true, true, 2),
    (comm_id, 'crm', true, true, true, 3),
    (comm_id, 'documents', true, true, true, 4),
    (comm_id, 'tenders', true, false, false, 5),
    (comm_id, 'commercial', true, true, true, 6),
    (comm_id, 'construction', false, false, false, 7),
    (comm_id, 'time-tracking', true, true, true, 8),
    (comm_id, 'resources', true, true, false, 9),
    (comm_id, 'calendar', true, true, true, 10),
    (comm_id, 'references', true, false, false, 11),
    (comm_id, 'objects', false, false, false, 12),
    (comm_id, 'campaigns', true, true, true, 13),
    (comm_id, 'media-planning', true, true, true, 14);
END $$;

-- 6. Create trigger for updated_at on disciplines
CREATE TRIGGER update_disciplines_updated_at
BEFORE UPDATE ON public.disciplines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();