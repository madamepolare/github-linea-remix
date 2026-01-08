-- Extend crm_emails table with additional columns for full entity support
ALTER TABLE public.crm_emails
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tender_id uuid REFERENCES public.tenders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cc text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bcc text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reply_to_email_id uuid REFERENCES public.crm_emails(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_emails_project_id ON public.crm_emails(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_tender_id ON public.crm_emails(tender_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_thread_id ON public.crm_emails(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_contact_id ON public.crm_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_company_id ON public.crm_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_lead_id ON public.crm_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_direction ON public.crm_emails(direction);
CREATE INDEX IF NOT EXISTS idx_crm_emails_is_read ON public.crm_emails(is_read) WHERE is_read = false;