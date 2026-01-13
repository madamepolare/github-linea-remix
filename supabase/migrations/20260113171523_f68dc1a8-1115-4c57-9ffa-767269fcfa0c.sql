-- Insert the AI Sales Agent module as a premium paid module
INSERT INTO modules (
  slug,
  name,
  description,
  icon,
  category,
  price_monthly,
  price_yearly,
  is_core,
  is_active,
  sort_order,
  features
) VALUES (
  'ai-sales-agent',
  'Agent Commercial IA',
  'Prospection automatisée avec intelligence artificielle pour trouver de nouveaux contacts et entreprises',
  'Bot',
  'premium',
  39.00,
  390.00,
  false,
  true,
  10,
  '["Recherche web IA", "Extraction contacts automatique", "Conversion en leads CRM", "Historique de recherche"]'::jsonb
);