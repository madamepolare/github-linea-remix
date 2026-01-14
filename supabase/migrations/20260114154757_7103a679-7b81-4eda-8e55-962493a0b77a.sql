-- Table pour les lots d'un appel d'offres
CREATE TABLE IF NOT EXISTS public.tender_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  intitule TEXT NOT NULL,
  domaine TEXT,
  attribution_type TEXT DEFAULT 'mono', -- 'mono' ou 'multi'
  nb_attributaires INTEGER,
  budget_min NUMERIC,
  budget_max NUMERIC,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id)
);

-- Critères d'évaluation par lot
CREATE TABLE IF NOT EXISTS public.tender_lot_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES tender_lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL, -- Pondération en pourcentage
  type TEXT DEFAULT 'technical', -- 'technical' ou 'financial'
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tender_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_lot_criteria ENABLE ROW LEVEL SECURITY;

-- Policies for tender_lots
CREATE POLICY "Users can view tender lots in their workspace" 
ON public.tender_lots 
FOR SELECT 
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create tender lots in their workspace" 
ON public.tender_lots 
FOR INSERT 
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update tender lots in their workspace" 
ON public.tender_lots 
FOR UPDATE 
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete tender lots in their workspace" 
ON public.tender_lots 
FOR DELETE 
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

-- Policies for tender_lot_criteria
CREATE POLICY "Users can view criteria for their lots" 
ON public.tender_lot_criteria 
FOR SELECT 
USING (lot_id IN (
  SELECT id FROM tender_lots WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can create criteria for their lots" 
ON public.tender_lot_criteria 
FOR INSERT 
WITH CHECK (lot_id IN (
  SELECT id FROM tender_lots WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can update criteria for their lots" 
ON public.tender_lot_criteria 
FOR UPDATE 
USING (lot_id IN (
  SELECT id FROM tender_lots WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can delete criteria for their lots" 
ON public.tender_lot_criteria 
FOR DELETE 
USING (lot_id IN (
  SELECT id FROM tender_lots WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
));

-- Ajouter colonne has_allotissement à la table tenders si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'has_allotissement') THEN
    ALTER TABLE public.tenders ADD COLUMN has_allotissement BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'nb_lots') THEN
    ALTER TABLE public.tenders ADD COLUMN nb_lots INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'validity_reminder_enabled') THEN
    ALTER TABLE public.tenders ADD COLUMN validity_reminder_enabled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'validity_reminder_months') THEN
    ALTER TABLE public.tenders ADD COLUMN validity_reminder_months INTEGER DEFAULT 2;
  END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tender_lots_tender_id ON tender_lots(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_lots_workspace_id ON tender_lots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tender_lot_criteria_lot_id ON tender_lot_criteria(lot_id);