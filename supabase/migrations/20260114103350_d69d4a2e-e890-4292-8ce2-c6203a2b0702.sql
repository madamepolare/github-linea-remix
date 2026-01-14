-- ===========================================
-- PARTIE 1: Enveloppes Budgétaires
-- ===========================================

-- Table des enveloppes budgétaires de projet
CREATE TABLE public.project_budget_envelopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'quote_phase', 'quote_grouped')),
  source_document_id UUID REFERENCES public.commercial_documents(id) ON DELETE SET NULL,
  source_phase_ids JSONB DEFAULT '[]'::jsonb,
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  consumed_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC GENERATED ALWAYS AS (budget_amount - consumed_amount) STORED,
  alert_threshold NUMERIC DEFAULT 80,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'closed')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter lien enveloppe sur project_purchases
ALTER TABLE public.project_purchases 
ADD COLUMN IF NOT EXISTS budget_envelope_id UUID REFERENCES public.project_budget_envelopes(id) ON DELETE SET NULL;

-- Index pour performances
CREATE INDEX idx_budget_envelopes_project ON public.project_budget_envelopes(project_id);
CREATE INDEX idx_budget_envelopes_workspace ON public.project_budget_envelopes(workspace_id);
CREATE INDEX idx_purchases_envelope ON public.project_purchases(budget_envelope_id);

-- RLS pour enveloppes budgétaires
ALTER TABLE public.project_budget_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view envelopes in their workspace"
ON public.project_budget_envelopes FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create envelopes in their workspace"
ON public.project_budget_envelopes FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update envelopes in their workspace"
ON public.project_budget_envelopes FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete envelopes in their workspace"
ON public.project_budget_envelopes FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Trigger pour mettre à jour consumed_amount
CREATE OR REPLACE FUNCTION public.update_envelope_consumed_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on ajoute/modifie un achat avec une enveloppe
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.budget_envelope_id IS NOT NULL THEN
      UPDATE public.project_budget_envelopes
      SET consumed_amount = (
        SELECT COALESCE(SUM(amount_ht), 0)
        FROM public.project_purchases
        WHERE budget_envelope_id = NEW.budget_envelope_id
      ),
      status = CASE 
        WHEN (SELECT COALESCE(SUM(amount_ht), 0) FROM public.project_purchases WHERE budget_envelope_id = NEW.budget_envelope_id) >= budget_amount THEN 'exhausted'
        ELSE 'active'
      END,
      updated_at = now()
      WHERE id = NEW.budget_envelope_id;
    END IF;
    
    -- Si on change d'enveloppe, mettre à jour l'ancienne aussi
    IF TG_OP = 'UPDATE' AND OLD.budget_envelope_id IS NOT NULL AND OLD.budget_envelope_id != COALESCE(NEW.budget_envelope_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      UPDATE public.project_budget_envelopes
      SET consumed_amount = (
        SELECT COALESCE(SUM(amount_ht), 0)
        FROM public.project_purchases
        WHERE budget_envelope_id = OLD.budget_envelope_id
      ),
      status = CASE 
        WHEN (SELECT COALESCE(SUM(amount_ht), 0) FROM public.project_purchases WHERE budget_envelope_id = OLD.budget_envelope_id) >= budget_amount THEN 'exhausted'
        ELSE 'active'
      END,
      updated_at = now()
      WHERE id = OLD.budget_envelope_id;
    END IF;
  END IF;
  
  -- Si on supprime un achat
  IF TG_OP = 'DELETE' AND OLD.budget_envelope_id IS NOT NULL THEN
    UPDATE public.project_budget_envelopes
    SET consumed_amount = (
      SELECT COALESCE(SUM(amount_ht), 0)
      FROM public.project_purchases
      WHERE budget_envelope_id = OLD.budget_envelope_id
    ),
    status = 'active',
    updated_at = now()
    WHERE id = OLD.budget_envelope_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_envelope_consumed
AFTER INSERT OR UPDATE OR DELETE ON public.project_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_envelope_consumed_amount();

-- ===========================================
-- PARTIE 2: Extension table invoices
-- ===========================================

-- Ajouter les colonnes manquantes pour conformité facturation électronique
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'invoice' CHECK (document_type IN ('proforma', 'advance', 'deposit', 'invoice', 'credit_note', 'final')),
ADD COLUMN IF NOT EXISTS related_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS original_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS legal_mentions TEXT,
ADD COLUMN IF NOT EXISTS penalty_rate NUMERIC DEFAULT 3,
ADD COLUMN IF NOT EXISTS recovery_costs NUMERIC DEFAULT 40,
ADD COLUMN IF NOT EXISTS advance_payments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS retentions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS chorus_status TEXT DEFAULT 'not_submitted' CHECK (chorus_status IN ('not_submitted', 'pending', 'submitted', 'accepted', 'rejected', 'paid')),
ADD COLUMN IF NOT EXISTS chorus_submission_id TEXT,
ADD COLUMN IF NOT EXISTS chorus_submission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS chorus_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS facturx_xml TEXT,
ADD COLUMN IF NOT EXISTS is_public_sector BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_code TEXT,
ADD COLUMN IF NOT EXISTS engagement_number TEXT;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON public.invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_invoices_chorus_status ON public.invoices(chorus_status);
CREATE INDEX IF NOT EXISTS idx_invoices_related ON public.invoices(related_invoice_id);

-- ===========================================
-- PARTIE 3: Table échéancier de facturation
-- ===========================================

CREATE TABLE public.invoice_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.commercial_documents(id) ON DELETE SET NULL,
  schedule_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  percentage NUMERIC,
  amount_ht NUMERIC NOT NULL,
  amount_ttc NUMERIC,
  vat_rate NUMERIC DEFAULT 20,
  planned_date DATE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'cancelled')),
  phase_ids JSONB DEFAULT '[]'::jsonb,
  milestone TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_invoice_schedule_project ON public.invoice_schedule(project_id);
CREATE INDEX idx_invoice_schedule_workspace ON public.invoice_schedule(workspace_id);
CREATE INDEX idx_invoice_schedule_status ON public.invoice_schedule(status);

-- RLS
ALTER TABLE public.invoice_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedule in their workspace"
ON public.invoice_schedule FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create schedule in their workspace"
ON public.invoice_schedule FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update schedule in their workspace"
ON public.invoice_schedule FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete schedule in their workspace"
ON public.invoice_schedule FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- ===========================================
-- PARTIE 4: Configuration Chorus Pro
-- ===========================================

CREATE TABLE public.chorus_pro_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  siret TEXT NOT NULL,
  chorus_login TEXT,
  technical_id TEXT,
  service_code_default TEXT,
  is_sandbox BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.chorus_pro_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view config in their workspace"
ON public.chorus_pro_config FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage config in their workspace"
ON public.chorus_pro_config FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ===========================================
-- PARTIE 5: Historique soumissions Chorus
-- ===========================================

CREATE TABLE public.chorus_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  submission_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_chorus_submissions_invoice ON public.chorus_submissions(invoice_id);
CREATE INDEX idx_chorus_submissions_workspace ON public.chorus_submissions(workspace_id);

ALTER TABLE public.chorus_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view submissions in their workspace"
ON public.chorus_submissions FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create submissions in their workspace"
ON public.chorus_submissions FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- ===========================================
-- PARTIE 6: Realtime
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_budget_envelopes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_schedule;

-- Trigger updated_at
CREATE TRIGGER update_budget_envelopes_updated_at
BEFORE UPDATE ON public.project_budget_envelopes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_schedule_updated_at
BEFORE UPDATE ON public.invoice_schedule
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chorus_pro_config_updated_at
BEFORE UPDATE ON public.chorus_pro_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();