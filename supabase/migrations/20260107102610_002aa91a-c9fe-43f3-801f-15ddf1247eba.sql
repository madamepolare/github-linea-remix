-- Ajouter les champs de contexte pour remonter les communications
ALTER TABLE public.communications 
ADD COLUMN context_entity_type TEXT,
ADD COLUMN context_entity_id UUID;

-- Index pour requêtes par contexte
CREATE INDEX idx_communications_context ON public.communications(context_entity_type, context_entity_id);

-- Commentaire explicatif
COMMENT ON COLUMN public.communications.context_entity_type IS 'Type de l''entité parente (ex: project quand la comm vient d''une tâche liée au projet)';
COMMENT ON COLUMN public.communications.context_entity_id IS 'ID de l''entité parente pour agrégation';

-- Mise à jour des contraintes check pour context_entity_type
ALTER TABLE public.communications 
ADD CONSTRAINT check_context_entity_type 
CHECK (context_entity_type IS NULL OR context_entity_type IN ('project', 'lead', 'company', 'contact', 'tender'));