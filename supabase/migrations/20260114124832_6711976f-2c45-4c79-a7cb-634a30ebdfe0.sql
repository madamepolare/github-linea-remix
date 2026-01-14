-- Fix search_path for the function
CREATE OR REPLACE FUNCTION log_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.invoice_history (workspace_id, invoice_id, event_type, description, new_value, user_id)
    VALUES (NEW.workspace_id, NEW.id, 'created', 'Facture créée', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.invoice_history (workspace_id, invoice_id, event_type, description, old_value, new_value, user_id)
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
      INSERT INTO public.invoice_history (workspace_id, invoice_id, event_type, description, old_value, new_value, user_id)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;