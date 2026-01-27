-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 4: CRM TABLES
-- =====================================================
-- Companies, Contacts, Leads, Pipelines
-- =====================================================

-- CRM Companies table
CREATE TABLE public.crm_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'prospect',
  industry TEXT,
  size TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  siret TEXT,
  siren TEXT,
  vat_number TEXT,
  logo_url TEXT,
  description TEXT,
  notes TEXT,
  tags TEXT[],
  category TEXT,
  sub_category TEXT,
  source TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  parent_company_id UUID REFERENCES public.crm_companies(id),
  billing_address TEXT,
  billing_city TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  annual_revenue NUMERIC,
  employee_count INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  crm_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_billing_contact BOOLEAN DEFAULT false,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  linkedin_url TEXT,
  notes TEXT,
  tags TEXT[],
  source TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  last_contact_at TIMESTAMPTZ,
  avatar_url TEXT,
  salutation TEXT,
  birthday DATE,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_sensitive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Company departments
CREATE TABLE public.company_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  manager_contact_id UUID REFERENCES public.contacts(id),
  billing_contact_id UUID REFERENCES public.contacts(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;

-- Leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  estimated_value NUMERIC,
  probability INTEGER,
  expected_close_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES public.crm_companies(id),
  contact_id UUID REFERENCES public.contacts(id),
  tags TEXT[],
  notes TEXT,
  lost_reason TEXT,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  converted_to_project_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Lead activities
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- CRM Pipelines
CREATE TABLE public.crm_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'contact',
  is_default BOOLEAN DEFAULT false,
  color TEXT,
  icon TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;

-- CRM Pipeline stages
CREATE TABLE public.crm_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  auto_actions JSONB DEFAULT '[]'::jsonb,
  email_template_id UUID,
  delay_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Contact pipeline entries
CREATE TABLE public.contact_pipeline_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  notes TEXT,
  entered_at TIMESTAMPTZ DEFAULT now(),
  last_email_sent_at TIMESTAMPTZ,
  last_inbound_email_at TIMESTAMPTZ,
  awaiting_response BOOLEAN DEFAULT false,
  unread_replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_pipeline_entries ENABLE ROW LEVEL SECURITY;

-- Contact pipeline emails
CREATE TABLE public.contact_pipeline_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.contact_pipeline_entries(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id),
  template_id UUID,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_pipeline_emails ENABLE ROW LEVEL SECURITY;

-- CRM Emails
CREATE TABLE public.crm_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  direction TEXT NOT NULL DEFAULT 'outbound',
  from_email TEXT,
  to_email TEXT,
  cc TEXT,
  bcc TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  labels TEXT[],
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_emails ENABLE ROW LEVEL SECURITY;

-- Email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Pipeline actions (automation)
CREATE TABLE public.pipeline_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipeline_actions ENABLE ROW LEVEL SECURITY;

-- AI Prospects
CREATE TABLE public.ai_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_address TEXT,
  company_city TEXT,
  company_postal_code TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  source_query TEXT NOT NULL,
  source_url TEXT,
  confidence_score NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  converted_company_id UUID REFERENCES public.crm_companies(id),
  converted_contact_id UUID REFERENCES public.contacts(id),
  converted_lead_id UUID REFERENCES public.leads(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_prospects ENABLE ROW LEVEL SECURITY;

-- Auto associate CRM email function
CREATE OR REPLACE FUNCTION public.auto_associate_crm_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_company_id uuid;
  v_target_email text;
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.direction = 'outbound' THEN
    v_target_email := NEW.to_email;
  ELSE
    v_target_email := NEW.from_email;
  END IF;

  IF v_target_email IS NOT NULL THEN
    SELECT id, crm_company_id INTO v_contact_id, v_company_id
    FROM contacts
    WHERE workspace_id = NEW.workspace_id
      AND LOWER(email) = LOWER(v_target_email)
    LIMIT 1;

    IF v_contact_id IS NOT NULL THEN
      NEW.contact_id := v_contact_id;
      IF NEW.company_id IS NULL AND v_company_id IS NOT NULL THEN
        NEW.company_id := v_company_id;
      END IF;
    END IF;
  END IF;

  IF NEW.company_id IS NULL AND v_target_email IS NOT NULL THEN
    SELECT id INTO v_company_id
    FROM crm_companies
    WHERE workspace_id = NEW.workspace_id
      AND LOWER(email) = LOWER(v_target_email)
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
      NEW.company_id := v_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_associate_crm_email
BEFORE INSERT ON public.crm_emails
FOR EACH ROW
EXECUTE FUNCTION public.auto_associate_crm_email();
