-- Add missing columns to support workspace email tracking and display in CRM
ALTER TABLE public.crm_emails
  ADD COLUMN IF NOT EXISTS workspace_email_account_id uuid NULL,
  ADD COLUMN IF NOT EXISTS sent_via text NULL;

-- Optional FK for integrity (no cascade to avoid accidental deletes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_emails_workspace_email_account_id_fkey'
  ) THEN
    ALTER TABLE public.crm_emails
      ADD CONSTRAINT crm_emails_workspace_email_account_id_fkey
      FOREIGN KEY (workspace_email_account_id)
      REFERENCES public.workspace_email_accounts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful index for filtering
CREATE INDEX IF NOT EXISTS idx_crm_emails_workspace_email_account_id
  ON public.crm_emails (workspace_email_account_id);

CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_thread_id
  ON public.crm_emails (gmail_thread_id);
