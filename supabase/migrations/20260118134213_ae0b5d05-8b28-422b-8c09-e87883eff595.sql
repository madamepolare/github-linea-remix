-- Add custom HTML template field to quote_themes
ALTER TABLE public.quote_themes 
ADD COLUMN IF NOT EXISTS custom_html_template TEXT,
ADD COLUMN IF NOT EXISTS css_variables JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fonts_used TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS use_custom_html BOOLEAN DEFAULT false;