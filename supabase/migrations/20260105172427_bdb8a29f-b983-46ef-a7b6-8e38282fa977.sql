-- ===========================================
-- MODULE ÉQUIPE - Tables et RLS Policies
-- ===========================================

-- 1. Table team_time_entries - Suivi des temps
CREATE TABLE public.team_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_billable BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_validation', 'validated', 'rejected')),
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Table team_absences - Gestion des absences
CREATE TABLE public.team_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  absence_type TEXT NOT NULL DEFAULT 'conge_paye' CHECK (absence_type IN ('conge_paye', 'rtt', 'maladie', 'sans_solde', 'formation', 'teletravail', 'autre')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_half_day BOOLEAN DEFAULT false,
  end_half_day BOOLEAN DEFAULT false,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Table team_requests - Demandes d'équipe
CREATE TABLE public.team_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'other' CHECK (request_type IN ('resource', 'training', 'equipment', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'completed')),
  assigned_to UUID,
  response TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Table team_evaluations - Évaluations et entretiens
CREATE TABLE public.team_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  evaluator_id UUID NOT NULL,
  evaluation_type TEXT NOT NULL DEFAULT 'annual' CHECK (evaluation_type IN ('annual', 'probation', 'objective_review', 'other')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  objectives JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Table job_offers - Offres d'emploi
CREATE TABLE public.job_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  contract_type TEXT DEFAULT 'cdi' CHECK (contract_type IN ('cdi', 'cdd', 'stage', 'alternance', 'freelance')),
  location TEXT,
  remote_policy TEXT DEFAULT 'onsite' CHECK (remote_policy IN ('onsite', 'hybrid', 'remote')),
  salary_min INTEGER,
  salary_max INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed')),
  published_at TIMESTAMP WITH TIME ZONE,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Table job_applications - Candidatures
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_offer_id UUID NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  cv_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'interview_scheduled', 'interview_done', 'offer', 'rejected', 'hired', 'withdrawn')),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  interview_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- Index pour les performances
-- ===========================================

CREATE INDEX idx_team_time_entries_workspace ON public.team_time_entries(workspace_id);
CREATE INDEX idx_team_time_entries_user ON public.team_time_entries(user_id);
CREATE INDEX idx_team_time_entries_date ON public.team_time_entries(date);
CREATE INDEX idx_team_time_entries_status ON public.team_time_entries(status);

CREATE INDEX idx_team_absences_workspace ON public.team_absences(workspace_id);
CREATE INDEX idx_team_absences_user ON public.team_absences(user_id);
CREATE INDEX idx_team_absences_dates ON public.team_absences(start_date, end_date);

CREATE INDEX idx_team_requests_workspace ON public.team_requests(workspace_id);
CREATE INDEX idx_team_requests_status ON public.team_requests(status);

CREATE INDEX idx_team_evaluations_workspace ON public.team_evaluations(workspace_id);
CREATE INDEX idx_team_evaluations_user ON public.team_evaluations(user_id);

CREATE INDEX idx_job_offers_workspace ON public.job_offers(workspace_id);
CREATE INDEX idx_job_offers_status ON public.job_offers(status);

CREATE INDEX idx_job_applications_offer ON public.job_applications(job_offer_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- ===========================================
-- Enable RLS sur toutes les tables
-- ===========================================

ALTER TABLE public.team_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies - team_time_entries
-- ===========================================

CREATE POLICY "Users can view time entries in their workspace"
ON public.team_time_entries FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own time entries"
ON public.team_time_entries FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own time entries"
ON public.team_time_entries FOR UPDATE
USING (
  auth.uid() = user_id OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can delete their own draft time entries"
ON public.team_time_entries FOR DELETE
USING (
  auth.uid() = user_id AND status = 'draft'
);

-- ===========================================
-- RLS Policies - team_absences
-- ===========================================

CREATE POLICY "Users can view absences in their workspace"
ON public.team_absences FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own absence requests"
ON public.team_absences FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own pending absences or admins can update any"
ON public.team_absences FOR UPDATE
USING (
  (auth.uid() = user_id AND status = 'pending') OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can delete their own pending absence requests"
ON public.team_absences FOR DELETE
USING (
  auth.uid() = user_id AND status = 'pending'
);

-- ===========================================
-- RLS Policies - team_requests
-- ===========================================

CREATE POLICY "Users can view requests in their workspace"
ON public.team_requests FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create requests in their workspace"
ON public.team_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own requests or admins can update any"
ON public.team_requests FOR UPDATE
USING (
  auth.uid() = user_id OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can delete their own pending requests"
ON public.team_requests FOR DELETE
USING (
  auth.uid() = user_id AND status = 'pending'
);

-- ===========================================
-- RLS Policies - team_evaluations
-- ===========================================

CREATE POLICY "Users can view evaluations in their workspace"
ON public.team_evaluations FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  ) AND (
    auth.uid() = user_id OR 
    auth.uid() = evaluator_id OR
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
);

CREATE POLICY "Admins can create evaluations"
ON public.team_evaluations FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Evaluators and admins can update evaluations"
ON public.team_evaluations FOR UPDATE
USING (
  auth.uid() = evaluator_id OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete evaluations"
ON public.team_evaluations FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ===========================================
-- RLS Policies - job_offers
-- ===========================================

CREATE POLICY "Users can view job offers in their workspace"
ON public.job_offers FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create job offers"
ON public.job_offers FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update job offers"
ON public.job_offers FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete job offers"
ON public.job_offers FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ===========================================
-- RLS Policies - job_applications
-- ===========================================

CREATE POLICY "Users can view applications in their workspace"
ON public.job_applications FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update applications"
ON public.job_applications FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete applications"
ON public.job_applications FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ===========================================
-- Triggers pour updated_at
-- ===========================================

CREATE TRIGGER update_team_time_entries_updated_at
BEFORE UPDATE ON public.team_time_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_absences_updated_at
BEFORE UPDATE ON public.team_absences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_requests_updated_at
BEFORE UPDATE ON public.team_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_evaluations_updated_at
BEFORE UPDATE ON public.team_evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_offers_updated_at
BEFORE UPDATE ON public.job_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();