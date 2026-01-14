-- Ajouter les champs de période couverte aux factures
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS period_start DATE,
ADD COLUMN IF NOT EXISTS period_end DATE;

-- Créer la table d'historique des factures
CREATE TABLE IF NOT EXISTS invoice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoice_history_invoice ON invoice_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_workspace ON invoice_history(workspace_id);

-- RLS
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice history in their workspace"
  ON invoice_history FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert invoice history in their workspace"
  ON invoice_history FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Trigger pour logger automatiquement les changements sur les factures
CREATE OR REPLACE FUNCTION log_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO invoice_history (workspace_id, invoice_id, event_type, description, new_value, user_id)
    VALUES (NEW.workspace_id, NEW.id, 'created', 'Facture créée', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO invoice_history (workspace_id, invoice_id, event_type, description, old_value, new_value, user_id)
      VALUES (
        NEW.workspace_id, 
        NEW.id, 
        CASE 
          WHEN NEW.status = 'sent' THEN 'sent'
          WHEN NEW.status = 'paid' THEN 'paid'
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          ELSE 'updated'
        END,
        'Statut changé de ' || COALESCE(OLD.status, 'draft') || ' à ' || NEW.status,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        auth.uid()
      );
    END IF;
    -- Log amount changes
    IF OLD.total_ttc IS DISTINCT FROM NEW.total_ttc THEN
      INSERT INTO invoice_history (workspace_id, invoice_id, event_type, description, old_value, new_value, user_id)
      VALUES (
        NEW.workspace_id,
        NEW.id,
        'updated',
        'Montant modifié',
        jsonb_build_object('total_ttc', OLD.total_ttc),
        jsonb_build_object('total_ttc', NEW.total_ttc),
        auth.uid()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS invoice_history_trigger ON invoices;

-- Créer le trigger
CREATE TRIGGER invoice_history_trigger
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_invoice_changes();