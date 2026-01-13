-- Table pour gérer les types d'appels d'offres configurables par discipline
CREATE TABLE public.tender_type_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  discipline_slug TEXT NOT NULL CHECK (discipline_slug IN ('architecture', 'scenographie', 'communication')),
  type_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'FileText',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Champs spécifiques à ce type d'AO (configuration des formulaires)
  specific_fields JSONB DEFAULT '[]',
  
  -- Documents requis pour ce type
  required_documents JSONB DEFAULT '{"candidature": [], "offre": []}',
  
  -- Critères par défaut pour ce type
  default_criteria JSONB DEFAULT '[]',
  
  -- Prompts IA personnalisés pour ce type
  ai_prompts JSONB DEFAULT '{"dce_analysis": "", "memoire_generation": ""}',
  
  -- Particularités et règles spécifiques
  particularities JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, discipline_slug, type_key)
);

-- Index pour les requêtes courantes
CREATE INDEX idx_tender_type_configs_workspace ON public.tender_type_configs(workspace_id);
CREATE INDEX idx_tender_type_configs_discipline ON public.tender_type_configs(workspace_id, discipline_slug);
CREATE INDEX idx_tender_type_configs_active ON public.tender_type_configs(workspace_id, discipline_slug, is_active);

-- Enable Row Level Security
ALTER TABLE public.tender_type_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view tender type configs in their workspace"
ON public.tender_type_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = tender_type_configs.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage tender type configs"
ON public.tender_type_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = tender_type_configs.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_tender_type_configs_updated_at
BEFORE UPDATE ON public.tender_type_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();