
-- Plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    max_users INTEGER DEFAULT 1,
    max_projects INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 1,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workspace subscriptions
CREATE TABLE public.workspace_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (workspace_id)
);

-- Available modules/extensions
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT DEFAULT 'general',
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    is_core BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '[]'::jsonb,
    required_plan TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workspace enabled modules
CREATE TABLE public.workspace_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    enabled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    enabled_by UUID REFERENCES auth.users(id),
    settings JSONB DEFAULT '{}'::jsonb,
    UNIQUE (workspace_id, module_id)
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_modules ENABLE ROW LEVEL SECURITY;

-- Plans are public read
CREATE POLICY "Anyone can view active plans" ON public.plans
FOR SELECT USING (is_active = true);

-- Modules are public read
CREATE POLICY "Anyone can view active modules" ON public.modules
FOR SELECT USING (is_active = true);

-- Workspace subscriptions
CREATE POLICY "Members can view their workspace subscription" ON public.workspace_subscriptions
FOR SELECT USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
);

CREATE POLICY "Owners can manage subscriptions" ON public.workspace_subscriptions
FOR ALL USING (
    public.has_role(auth.uid(), workspace_id, 'owner')
);

-- Workspace modules
CREATE POLICY "Members can view their workspace modules" ON public.workspace_modules
FOR SELECT USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
);

CREATE POLICY "Admins can manage workspace modules" ON public.workspace_modules
FOR ALL USING (
    public.has_role_or_higher(auth.uid(), workspace_id, 'admin')
);

-- Insert default plans
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, max_users, max_projects, max_storage_gb, features, sort_order) VALUES
('Gratuit', 'free', 'Pour démarrer', 0, 0, 3, 5, 1, '["Projets basiques", "CRM limité", "1 Go stockage"]', 1),
('Pro', 'pro', 'Pour les équipes', 29, 290, 10, 50, 10, '["Projets illimités", "CRM complet", "10 Go stockage", "Support prioritaire", "Exports PDF"]', 2),
('Business', 'business', 'Pour les agences', 79, 790, 50, -1, 100, '["Utilisateurs illimités", "Projets illimités", "100 Go stockage", "API access", "SSO", "Support dédié"]', 3),
('Enterprise', 'enterprise', 'Sur mesure', 0, 0, -1, -1, -1, '["Tout Business", "Installation on-premise", "SLA garanti", "Formation personnalisée"]', 4);

-- Insert default modules
INSERT INTO public.modules (name, slug, description, icon, category, price_monthly, price_yearly, is_core, features, sort_order) VALUES
('Projets', 'projects', 'Gestion de projets et phases', 'FolderKanban', 'core', 0, 0, true, '["Gestion des phases", "Planning Gantt", "Livrables"]', 1),
('CRM', 'crm', 'Gestion des contacts et leads', 'Users', 'core', 0, 0, true, '["Contacts", "Entreprises", "Pipeline leads"]', 2),
('Tâches', 'tasks', 'Gestion des tâches', 'CheckSquare', 'core', 0, 0, true, '["Kanban", "Assignation", "Sous-tâches"]', 3),
('Documents', 'documents', 'Gestion documentaire', 'FileStack', 'core', 0, 0, true, '["Templates", "Signatures", "Versioning"]', 4),
('Commercial', 'commercial', 'Devis et contrats', 'FileText', 'finance', 0, 0, true, '["Devis", "Contrats", "Propositions"]', 5),
('Facturation', 'invoicing', 'Factures et paiements', 'Receipt', 'finance', 9, 90, false, '["Factures", "Avoirs", "Relances auto"]', 6),
('Appels d''offres', 'tenders', 'Réponses aux marchés', 'Gavel', 'business', 19, 190, false, '["Analyse DCE", "Mémoire technique", "Équipe projet"]', 7),
('Chantier', 'chantier', 'Suivi de chantier', 'HardHat', 'business', 29, 290, false, '["Réunions", "Comptes-rendus", "Observations"]', 8),
('Équipe RH', 'team', 'Gestion des ressources humaines', 'UserCog', 'hr', 19, 190, false, '["Temps", "Absences", "Évaluations"]', 9),
('IA Avancée', 'ai-advanced', 'Fonctionnalités IA premium', 'Sparkles', 'premium', 29, 290, false, '["Génération documents", "Analyse automatique", "Suggestions intelligentes"]', 10);

-- Triggers
CREATE TRIGGER update_workspace_subscriptions_updated_at
BEFORE UPDATE ON public.workspace_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
