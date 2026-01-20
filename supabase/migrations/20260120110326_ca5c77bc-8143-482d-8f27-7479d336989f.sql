-- Add history_id column for incremental Gmail sync on workspace email accounts
ALTER TABLE public.workspace_email_accounts 
ADD COLUMN IF NOT EXISTS history_id BIGINT;