-- Mettre à jour le module "Objets" en "Commandes"
UPDATE modules SET 
  name = 'Commandes',
  description = 'Gestion des commandes produits et mobilier avec suivi livraison'
WHERE slug = 'objects';

-- Ajouter des colonnes de suivi de commande à project_objects
ALTER TABLE public.project_objects
  ADD COLUMN IF NOT EXISTS order_status text DEFAULT 'to_order',
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS supplier_url text,
  ADD COLUMN IF NOT EXISTS order_reference text,
  ADD COLUMN IF NOT EXISTS order_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expected_delivery_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS actual_delivery_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS price_unit numeric,
  ADD COLUMN IF NOT EXISTS price_total numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS installation_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS installed_by text,
  ADD COLUMN IF NOT EXISTS alert_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_days_before integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Créer trigger pour updated_at
CREATE OR REPLACE FUNCTION update_project_objects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_project_objects_updated_at ON project_objects;
CREATE TRIGGER update_project_objects_updated_at
  BEFORE UPDATE ON project_objects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_objects_updated_at();