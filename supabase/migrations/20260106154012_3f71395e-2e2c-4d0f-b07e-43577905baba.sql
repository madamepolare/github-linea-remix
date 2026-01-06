-- Corriger le search_path de la fonction
CREATE OR REPLACE FUNCTION public.update_contact_pipeline_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;