-- Phase 1: Séparation des pipelines Opportunités vs Contacts

-- 1.1 Ajouter les champs sur crm_pipelines
ALTER TABLE public.crm_pipelines 
  ADD COLUMN IF NOT EXISTS pipeline_type TEXT DEFAULT 'opportunity',
  ADD COLUMN IF NOT EXISTS target_contact_type TEXT;

-- Contrainte pour pipeline_type
ALTER TABLE public.crm_pipelines 
  DROP CONSTRAINT IF EXISTS crm_pipelines_type_check;
ALTER TABLE public.crm_pipelines 
  ADD CONSTRAINT crm_pipelines_type_check CHECK (pipeline_type IN ('opportunity', 'contact'));

-- 1.2 Ajouter les champs sur crm_pipeline_stages
ALTER TABLE public.crm_pipeline_stages 
  ADD COLUMN IF NOT EXISTS email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_email_on_enter BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_final_stage BOOLEAN DEFAULT false;

-- 1.3 Créer la table contact_pipeline_entries
CREATE TABLE IF NOT EXISTS public.contact_pipeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ DEFAULT now(),
  last_email_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_contact_pipeline_entries_workspace ON public.contact_pipeline_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_pipeline_entries_pipeline ON public.contact_pipeline_entries(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_contact_pipeline_entries_stage ON public.contact_pipeline_entries(stage_id);
CREATE INDEX IF NOT EXISTS idx_contact_pipeline_entries_contact ON public.contact_pipeline_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_pipeline_entries_company ON public.contact_pipeline_entries(company_id);

-- Contrainte: un contact OU une entreprise, pas les deux
ALTER TABLE public.contact_pipeline_entries 
  DROP CONSTRAINT IF EXISTS contact_pipeline_entries_contact_or_company;
ALTER TABLE public.contact_pipeline_entries 
  ADD CONSTRAINT contact_pipeline_entries_contact_or_company CHECK (
    (contact_id IS NOT NULL AND company_id IS NULL) OR
    (contact_id IS NULL AND company_id IS NOT NULL)
  );

-- Contrainte d'unicité: un contact/entreprise ne peut être qu'une fois dans un pipeline
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_pipeline_entries_unique_contact 
  ON public.contact_pipeline_entries(pipeline_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_pipeline_entries_unique_company 
  ON public.contact_pipeline_entries(pipeline_id, company_id) WHERE company_id IS NOT NULL;

-- 1.4 Créer la table contact_pipeline_emails
CREATE TABLE IF NOT EXISTS public.contact_pipeline_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.contact_pipeline_entries(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_pipeline_emails_entry ON public.contact_pipeline_emails(entry_id);
CREATE INDEX IF NOT EXISTS idx_contact_pipeline_emails_workspace ON public.contact_pipeline_emails(workspace_id);

-- RLS pour contact_pipeline_entries
ALTER TABLE public.contact_pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact pipeline entries in their workspace"
  ON public.contact_pipeline_entries FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contact pipeline entries in their workspace"
  ON public.contact_pipeline_entries FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contact pipeline entries in their workspace"
  ON public.contact_pipeline_entries FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contact pipeline entries in their workspace"
  ON public.contact_pipeline_entries FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- RLS pour contact_pipeline_emails
ALTER TABLE public.contact_pipeline_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact pipeline emails in their workspace"
  ON public.contact_pipeline_emails FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contact pipeline emails in their workspace"
  ON public.contact_pipeline_emails FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contact pipeline emails in their workspace"
  ON public.contact_pipeline_emails FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contact pipeline emails in their workspace"
  ON public.contact_pipeline_emails FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Trigger pour updated_at sur contact_pipeline_entries
CREATE OR REPLACE FUNCTION public.update_contact_pipeline_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_pipeline_entries_updated_at ON public.contact_pipeline_entries;
CREATE TRIGGER update_contact_pipeline_entries_updated_at
  BEFORE UPDATE ON public.contact_pipeline_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_pipeline_entries_updated_at();