-- Ajouter colonnes spécifiques COMMUNICATION pour les accords-cadres
ALTER TABLE public.tenders
ADD COLUMN IF NOT EXISTS montant_minimum numeric,
ADD COLUMN IF NOT EXISTS montant_maximum numeric,
ADD COLUMN IF NOT EXISTS duree_initiale_mois integer,
ADD COLUMN IF NOT EXISTS nb_reconductions integer,
ADD COLUMN IF NOT EXISTS duree_reconduction_mois integer,
ADD COLUMN IF NOT EXISTS date_debut_mission timestamp with time zone,
ADD COLUMN IF NOT EXISTS validite_offre_jours integer,
ADD COLUMN IF NOT EXISTS cas_pratique jsonb,
ADD COLUMN IF NOT EXISTS audition jsonb,
ADD COLUMN IF NOT EXISTS is_multi_attributaire boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nb_attributaires integer,
ADD COLUMN IF NOT EXISTS lots jsonb,
ADD COLUMN IF NOT EXISTS type_campagne text,
ADD COLUMN IF NOT EXISTS cibles text,
ADD COLUMN IF NOT EXISTS anciens_prestataires jsonb,
ADD COLUMN IF NOT EXISTS deliverables_candidature jsonb,
ADD COLUMN IF NOT EXISTS deliverables_offre jsonb;

-- Ajouter colonnes spécifiques SCÉNOGRAPHIE
ALTER TABLE public.tenders
ADD COLUMN IF NOT EXISTS surface_exposition numeric,
ADD COLUMN IF NOT EXISTS duree_exposition_mois integer,
ADD COLUMN IF NOT EXISTS type_exposition text,
ADD COLUMN IF NOT EXISTS lieu_exposition text,
ADD COLUMN IF NOT EXISTS commissaire_exposition text,
ADD COLUMN IF NOT EXISTS oeuvres_estimees integer,
ADD COLUMN IF NOT EXISTS itinerance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lieux_itinerance jsonb,
ADD COLUMN IF NOT EXISTS contraintes_conservation text,
ADD COLUMN IF NOT EXISTS accessibilite_requise boolean DEFAULT true;

-- Ajouter index pour les filtres courants
CREATE INDEX IF NOT EXISTS idx_tenders_discipline ON public.tenders(discipline_slug);
CREATE INDEX IF NOT EXISTS idx_tenders_type_campagne ON public.tenders(type_campagne) WHERE type_campagne IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_type_exposition ON public.tenders(type_exposition) WHERE type_exposition IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.tenders.montant_minimum IS 'Montant minimum accord-cadre en € HT (communication)';
COMMENT ON COLUMN public.tenders.montant_maximum IS 'Montant maximum accord-cadre en € HT (communication)';
COMMENT ON COLUMN public.tenders.cas_pratique IS 'Détails du cas pratique: {requis, brief, livrables, format, delai_jours, ponderation}';
COMMENT ON COLUMN public.tenders.audition IS 'Info audition: {prevue, date, duree_minutes, format}';
COMMENT ON COLUMN public.tenders.surface_exposition IS 'Surface d''exposition en m² (scénographie)';
COMMENT ON COLUMN public.tenders.type_exposition IS 'Type: permanente, temporaire, itinerante';