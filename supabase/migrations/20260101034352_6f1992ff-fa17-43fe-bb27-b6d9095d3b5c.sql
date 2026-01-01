-- 1. Create crm_emails table
CREATE TABLE public.crm_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  to_email TEXT NOT NULL,
  from_email TEXT DEFAULT 'noreply@app.com',
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, failed
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_emails
CREATE POLICY "Workspace members can view emails"
ON public.crm_emails FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create emails"
ON public.crm_emails FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update emails"
ON public.crm_emails FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete emails"
ON public.crm_emails FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));

-- 2. Add missing columns to lead_activities
ALTER TABLE public.lead_activities
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Add company link to contacts (already exists crm_company_id but ensure it's there)
-- contacts already has crm_company_id

-- 4. Enable realtime for CRM tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_emails_lead_id ON public.crm_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_contact_id ON public.crm_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_workspace_id ON public.crm_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_industry ON public.crm_companies(industry);
CREATE INDEX IF NOT EXISTS idx_contacts_crm_company_id ON public.contacts(crm_company_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);