-- Add email signature column to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS email_signature TEXT;

-- Add email signature enabled flag
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS email_signature_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.workspaces.email_signature IS 'HTML email signature to append to all outgoing emails';
COMMENT ON COLUMN public.workspaces.email_signature_enabled IS 'Whether to automatically append email signature to outgoing emails';