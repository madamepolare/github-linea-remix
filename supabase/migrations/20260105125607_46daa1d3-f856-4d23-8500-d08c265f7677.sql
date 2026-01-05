-- Ajouter les champs logo_url et signature_url au workspace
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT;