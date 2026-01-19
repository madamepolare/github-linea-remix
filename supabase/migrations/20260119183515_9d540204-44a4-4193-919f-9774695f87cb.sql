-- Phase 3: Unification des statuts Tenders
-- Étendre pipeline_status pour inclure tous les états finaux

-- D'abord, supprimer l'ancienne contrainte
ALTER TABLE public.tenders 
DROP CONSTRAINT IF EXISTS tenders_pipeline_status_check;

-- Ajouter la nouvelle contrainte avec tous les statuts
ALTER TABLE public.tenders 
ADD CONSTRAINT tenders_pipeline_status_check 
CHECK (pipeline_status IN ('a_approuver', 'en_cours', 'deposes', 'gagnes', 'perdus', 'no_go', 'archives'));

-- Ajouter les colonnes pour le tracking No-Go
ALTER TABLE public.tenders
ADD COLUMN IF NOT EXISTS no_go_date timestamptz,
ADD COLUMN IF NOT EXISTS no_go_reason text;

-- Migrer les données de l'ancien status vers pipeline_status
UPDATE public.tenders 
SET pipeline_status = CASE 
  WHEN status = 'repere' OR status = 'en_analyse' THEN 'a_approuver'
  WHEN status = 'go' OR status = 'en_montage' THEN 'en_cours'
  WHEN status = 'depose' THEN 'deposes'
  WHEN status = 'gagne' THEN 'gagnes'
  WHEN status = 'perdu' THEN 'perdus'
  WHEN status = 'no_go' THEN 'no_go'
  ELSE pipeline_status
END
WHERE status IS NOT NULL AND pipeline_status IS NULL;

-- Ajouter un index pour améliorer les performances des requêtes par pipeline_status
CREATE INDEX IF NOT EXISTS idx_tenders_pipeline_status ON public.tenders(workspace_id, pipeline_status);

-- Commentaire pour documenter la migration
COMMENT ON COLUMN public.tenders.pipeline_status IS 'Statut unifié: a_approuver, en_cours, deposes, gagnes, perdus, no_go, archives';
COMMENT ON COLUMN public.tenders.no_go_date IS 'Date de décision No-Go';
COMMENT ON COLUMN public.tenders.no_go_reason IS 'Raison du No-Go';