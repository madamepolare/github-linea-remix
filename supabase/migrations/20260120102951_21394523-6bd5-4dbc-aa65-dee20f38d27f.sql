-- Create workspace email accounts table
CREATE TABLE public.workspace_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL DEFAULT 'gmail',
  gmail_email TEXT NOT NULL,
  display_name TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  connected_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workspace_id, gmail_email)
);

-- Enable RLS
ALTER TABLE public.workspace_email_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies: only admin/owner can manage workspace email accounts
CREATE POLICY "Admins can view workspace email accounts"
ON public.workspace_email_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_email_accounts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can insert workspace email accounts"
ON public.workspace_email_accounts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_email_accounts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update workspace email accounts"
ON public.workspace_email_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_email_accounts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete workspace email accounts"
ON public.workspace_email_accounts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_email_accounts.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

-- Members can view to use for sending (but not see tokens)
CREATE POLICY "Members can view workspace email for sending"
ON public.workspace_email_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_email_accounts.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Add sent_via column to communications table for email tracking
ALTER TABLE public.communications 
ADD COLUMN IF NOT EXISTS sent_via TEXT DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS workspace_email_account_id UUID REFERENCES public.workspace_email_accounts(id);

-- Create updated_at trigger
CREATE TRIGGER update_workspace_email_accounts_updated_at
BEFORE UPDATE ON public.workspace_email_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default per workspace
CREATE OR REPLACE FUNCTION public.ensure_single_default_workspace_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.workspace_email_accounts
    SET is_default = false
    WHERE workspace_id = NEW.workspace_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_single_default_workspace_email_trigger
BEFORE INSERT OR UPDATE ON public.workspace_email_accounts
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION public.ensure_single_default_workspace_email();