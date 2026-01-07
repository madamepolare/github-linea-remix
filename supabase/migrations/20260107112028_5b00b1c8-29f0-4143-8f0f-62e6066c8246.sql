-- Ajouter le module Workflow dans la table modules
INSERT INTO public.modules (name, slug, description, icon, category, price_monthly, price_yearly, is_core, is_active, features, required_plan, sort_order)
VALUES (
  'Workflow',
  'workflow',
  'Planification des tâches par membre d''équipe avec calendrier timeline et suggestions IA',
  'CalendarClock',
  'productivity',
  0,
  0,
  false,
  true,
  '["Calendrier timeline multi-ressources", "Drag & drop des tâches", "Planification IA automatique", "Vue par membre d''équipe"]'::jsonb,
  null,
  50
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;