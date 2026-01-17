-- Add email tracking fields to project_deliverables
ALTER TABLE public.project_deliverables
ADD COLUMN IF NOT EXISTS email_template TEXT,
ADD COLUMN IF NOT EXISTS email_link TEXT,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_to TEXT[];

-- Add comment for clarity
COMMENT ON COLUMN public.project_deliverables.email_template IS 'Custom email template text for this deliverable';
COMMENT ON COLUMN public.project_deliverables.email_link IS 'Drive/Dropbox link to include in email';
COMMENT ON COLUMN public.project_deliverables.email_sent_at IS 'Timestamp when email was last sent';
COMMENT ON COLUMN public.project_deliverables.email_sent_to IS 'Array of email addresses the deliverable was sent to';