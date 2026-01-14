-- Phase 1: Migrations complètes pour liaison Budget-Enveloppes-Temps-Facturation

-- 1. Ajouter le type d'enveloppe (temps, dépenses, mixte)
ALTER TABLE project_budget_envelopes 
ADD COLUMN IF NOT EXISTS envelope_type TEXT DEFAULT 'expenses';

COMMENT ON COLUMN project_budget_envelopes.envelope_type IS 'Type d''enveloppe: expenses (achats), time (temps), mixed (les deux)';

-- 2. Lier les time entries aux enveloppes et factures
ALTER TABLE team_time_entries 
ADD COLUMN IF NOT EXISTS budget_envelope_id UUID REFERENCES project_budget_envelopes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;

COMMENT ON COLUMN team_time_entries.budget_envelope_id IS 'Enveloppe budgétaire associée';
COMMENT ON COLUMN team_time_entries.invoice_id IS 'Facture associée si facturé';
COMMENT ON COLUMN team_time_entries.invoiced_at IS 'Date de facturation';
COMMENT ON COLUMN team_time_entries.hourly_rate IS 'Taux horaire appliqué';

-- 3. Créer la table d'historique des modifications budgétaires
CREATE TABLE IF NOT EXISTS project_budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  previous_budget NUMERIC,
  new_budget NUMERIC,
  change_type TEXT DEFAULT 'adjustment', -- 'initial', 'amendment', 'supplement', 'adjustment'
  change_reason TEXT,
  reference_document_id UUID REFERENCES commercial_documents(id) ON DELETE SET NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_budget_history
ALTER TABLE project_budget_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_budget_history
CREATE POLICY "Users can view budget history in their workspace"
ON project_budget_history FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert budget history in their workspace"
ON project_budget_history FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- 4. Ajouter les colonnes de facturation temps dans task_time_entries aussi
ALTER TABLE task_time_entries 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;

-- 5. Créer une fonction pour recalculer la consommation des enveloppes
CREATE OR REPLACE FUNCTION recalculate_envelope_consumption(envelope_id UUID)
RETURNS void AS $$
DECLARE
  env_record RECORD;
  purchases_total NUMERIC := 0;
  time_total NUMERIC := 0;
  new_consumed NUMERIC := 0;
BEGIN
  -- Get envelope info
  SELECT * INTO env_record FROM project_budget_envelopes WHERE id = envelope_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Calculate purchases total
  SELECT COALESCE(SUM(amount_ht), 0) INTO purchases_total
  FROM project_purchases
  WHERE budget_envelope_id = envelope_id;

  -- Calculate time total (team_time_entries)
  SELECT COALESCE(SUM((duration_minutes / 60.0) * COALESCE(hourly_rate, 0)), 0) INTO time_total
  FROM team_time_entries
  WHERE budget_envelope_id = envelope_id;

  -- Add task time entries if any
  SELECT time_total + COALESCE(SUM((duration_minutes / 60.0) * COALESCE(hourly_rate, 0)), 0) INTO time_total
  FROM task_time_entries te
  JOIN tasks t ON t.id = te.task_id
  JOIN project_budget_envelopes pbe ON pbe.project_id = t.project_id
  WHERE pbe.id = envelope_id AND t.project_id = env_record.project_id;

  -- Calculate new consumed based on envelope type
  IF env_record.envelope_type = 'expenses' THEN
    new_consumed := purchases_total;
  ELSIF env_record.envelope_type = 'time' THEN
    new_consumed := time_total;
  ELSE -- mixed
    new_consumed := purchases_total + time_total;
  END IF;

  -- Update the envelope
  UPDATE project_budget_envelopes
  SET 
    consumed_amount = new_consumed,
    remaining_amount = budget_amount - new_consumed,
    status = CASE 
      WHEN budget_amount - new_consumed <= 0 THEN 'exhausted'
      ELSE 'active'
    END,
    updated_at = now()
  WHERE id = envelope_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Trigger pour recalculer après modification des achats
CREATE OR REPLACE FUNCTION trigger_update_envelope_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(OLD.budget_envelope_id);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si l'enveloppe a changé, recalculer les deux
    IF OLD.budget_envelope_id IS DISTINCT FROM NEW.budget_envelope_id THEN
      IF OLD.budget_envelope_id IS NOT NULL THEN
        PERFORM recalculate_envelope_consumption(OLD.budget_envelope_id);
      END IF;
      IF NEW.budget_envelope_id IS NOT NULL THEN
        PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
      END IF;
    ELSIF NEW.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_purchase_envelope_update ON project_purchases;
CREATE TRIGGER trigger_purchase_envelope_update
AFTER INSERT OR UPDATE OR DELETE ON project_purchases
FOR EACH ROW EXECUTE FUNCTION trigger_update_envelope_on_purchase();

-- 7. Trigger pour recalculer après modification des time entries
CREATE OR REPLACE FUNCTION trigger_update_envelope_on_time_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(OLD.budget_envelope_id);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.budget_envelope_id IS DISTINCT FROM NEW.budget_envelope_id THEN
      IF OLD.budget_envelope_id IS NOT NULL THEN
        PERFORM recalculate_envelope_consumption(OLD.budget_envelope_id);
      END IF;
      IF NEW.budget_envelope_id IS NOT NULL THEN
        PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
      END IF;
    ELSIF NEW.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_time_entry_envelope_update ON team_time_entries;
CREATE TRIGGER trigger_time_entry_envelope_update
AFTER INSERT OR UPDATE OR DELETE ON team_time_entries
FOR EACH ROW EXECUTE FUNCTION trigger_update_envelope_on_time_entry();

-- 8. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_team_time_entries_envelope ON team_time_entries(budget_envelope_id);
CREATE INDEX IF NOT EXISTS idx_team_time_entries_invoice ON team_time_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_invoice ON task_time_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_project_budget_history_project ON project_budget_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budget_envelopes_type ON project_budget_envelopes(envelope_type);