-- Rendre le module Workflow core (toujours visible)
UPDATE public.modules 
SET is_core = true, sort_order = 5
WHERE slug = 'workflow';