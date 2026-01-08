
-- Create gmail_connections table for storing OAuth tokens per user
CREATE TABLE public.gmail_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  gmail_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  history_id BIGINT,
  watch_expiration TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own connections
CREATE POLICY "Users can view their own gmail connections"
  ON public.gmail_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gmail connections"
  ON public.gmail_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gmail connections"
  ON public.gmail_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gmail connections"
  ON public.gmail_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add Gmail-related columns to crm_emails
ALTER TABLE public.crm_emails 
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS synced_from_gmail BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_message_id ON public.crm_emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_thread_id ON public.crm_emails(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_workspace ON public.gmail_connections(user_id, workspace_id);

-- Trigger for updated_at
CREATE TRIGGER update_gmail_connections_updated_at
  BEFORE UPDATE ON public.gmail_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
