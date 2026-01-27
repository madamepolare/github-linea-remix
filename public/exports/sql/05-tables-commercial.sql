-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 5: COMMERCIAL TABLES
-- =====================================================
-- Quotes, Contracts, Invoices
-- =====================================================

-- Contract types
CREATE TABLE public.contract_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  default_phases JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;

-- Quote themes
CREATE TABLE public.quote_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  primary_color TEXT DEFAULT '#1a1a2e',
  secondary_color TEXT DEFAULT '#16213e',
  accent_color TEXT DEFAULT '#e94560',
  text_color TEXT DEFAULT '#1a1a2e',
  font_family TEXT DEFAULT 'Inter',
  header_font_family TEXT DEFAULT 'Playfair Display',
  logo_position TEXT DEFAULT 'left',
  show_page_numbers BOOLEAN DEFAULT true,
  header_style JSONB DEFAULT '{}'::jsonb,
  footer_style JSONB DEFAULT '{}'::jsonb,
  table_style JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quote_themes ENABLE ROW LEVEL SECURITY;

-- Commercial documents (quotes, contracts, proposals)
CREATE TABLE public.commercial_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'quote',
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Client info
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  billing_contact_id UUID REFERENCES public.contacts(id),
  reference_client TEXT,
  
  -- Project info
  project_id UUID,
  project_type TEXT DEFAULT 'other',
  project_address TEXT,
  project_city TEXT,
  postal_code TEXT,
  project_surface NUMERIC,
  project_budget NUMERIC,
  construction_budget NUMERIC,
  construction_budget_disclosed BOOLEAN DEFAULT false,
  
  -- Pricing
  fee_mode TEXT NOT NULL DEFAULT 'fixed',
  fee_percentage NUMERIC,
  hourly_rate NUMERIC,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  vat_type TEXT DEFAULT 'standard',
  vat_rate NUMERIC DEFAULT 20,
  
  -- Deposit and guarantees
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percentage NUMERIC DEFAULT 30,
  retention_guarantee_percentage NUMERIC,
  retention_guarantee_amount NUMERIC,
  
  -- Dates
  valid_until DATE,
  validity_days INTEGER DEFAULT 30,
  expected_start_date DATE,
  expected_end_date DATE,
  expected_signature_date DATE,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Content
  header_text TEXT,
  footer_text TEXT,
  general_conditions TEXT,
  special_conditions TEXT,
  payment_terms TEXT,
  notes TEXT,
  invoice_schedule JSONB DEFAULT '[]'::jsonb,
  
  -- Public market
  is_public_market BOOLEAN DEFAULT false,
  market_reference TEXT,
  is_amendment BOOLEAN DEFAULT false,
  
  -- Related entities
  contract_type_id UUID REFERENCES public.contract_types(id),
  quote_theme_id UUID REFERENCES public.quote_themes(id),
  internal_owner_id UUID REFERENCES auth.users(id),
  
  -- Files
  pdf_url TEXT,
  signed_pdf_url TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_documents ENABLE ROW LEVEL SECURITY;

-- Auto-generate document number
CREATE OR REPLACE FUNCTION public.set_document_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := generate_document_number(NEW.document_type, NEW.workspace_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_document_number
BEFORE INSERT ON public.commercial_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_document_number();

-- Commercial document phases
CREATE TABLE public.commercial_document_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  phase_code TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  phase_description TEXT,
  line_type TEXT DEFAULT 'service',
  
  -- Pricing
  pricing_mode TEXT DEFAULT 'fixed',
  percentage_fee NUMERIC,
  unit_price NUMERIC,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  amount NUMERIC DEFAULT 0,
  billing_type TEXT DEFAULT 'one_time',
  recurrence_months INTEGER,
  
  -- Margin (for resale)
  purchase_price NUMERIC,
  margin_percentage NUMERIC,
  
  -- Assignment
  skill_id UUID,
  assigned_skill TEXT,
  assigned_member_id UUID REFERENCES auth.users(id),
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Deliverables
  deliverables JSONB DEFAULT '[]'::jsonb,
  
  -- Display
  is_included BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_document_phases ENABLE ROW LEVEL SECURITY;

-- Commercial document items (legacy, sub-items)
CREATE TABLE public.commercial_document_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.commercial_document_phases(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'service',
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC,
  amount NUMERIC,
  is_optional BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_document_items ENABLE ROW LEVEL SECURITY;

-- Commercial document schedule (payment milestones)
CREATE TABLE public.commercial_document_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  schedule_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  milestone TEXT,
  percentage NUMERIC,
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC,
  amount_ttc NUMERIC,
  planned_date DATE,
  phase_ids JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_document_schedule ENABLE ROW LEVEL SECURITY;

-- Commercial document versions
CREATE TABLE public.commercial_document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  document_snapshot JSONB NOT NULL,
  phases_snapshot JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_document_versions ENABLE ROW LEVEL SECURITY;

-- Quote public links
CREATE TABLE public.quote_public_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  allow_signing BOOLEAN DEFAULT true,
  password_hash TEXT,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quote_public_links ENABLE ROW LEVEL SECURITY;

-- Commercial templates
CREATE TABLE public.commercial_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'quote',
  project_type TEXT DEFAULT 'other',
  header_text TEXT,
  footer_text TEXT,
  terms_conditions TEXT,
  default_phases JSONB DEFAULT '[]'::jsonb,
  default_clauses JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_templates ENABLE ROW LEVEL SECURITY;

-- Quote templates
CREATE TABLE public.quote_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  fee_mode TEXT DEFAULT 'fixed',
  vat_type TEXT DEFAULT 'standard',
  header_text TEXT,
  footer_text TEXT,
  general_conditions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Quote line templates
CREATE TABLE public.quote_line_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  quote_template_id UUID REFERENCES public.quote_templates(id) ON DELETE CASCADE,
  phase_code TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  description TEXT,
  pricing_mode TEXT DEFAULT 'fixed',
  percentage_fee NUMERIC,
  unit_price NUMERIC,
  unit TEXT,
  default_quantity NUMERIC DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quote_line_templates ENABLE ROW LEVEL SECURITY;

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT DEFAULT 'standard',
  title TEXT,
  
  -- References
  document_id UUID REFERENCES public.commercial_documents(id),
  project_id UUID,
  company_id UUID REFERENCES public.crm_companies(id),
  contact_id UUID REFERENCES public.contacts(id),
  billing_profile_id UUID,
  
  -- Amounts
  total_ht NUMERIC DEFAULT 0,
  total_vat NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  vat_rate NUMERIC DEFAULT 20,
  discount_amount NUMERIC DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  
  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft',
  payment_status TEXT DEFAULT 'unpaid',
  
  -- Content
  header_text TEXT,
  footer_text TEXT,
  notes TEXT,
  payment_terms TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,
  
  -- Files
  pdf_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.invoice_type, NEW.workspace_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_number();

-- Invoice items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 20,
  phase_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Invoice payments
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- Invoice reminders
CREATE TABLE public.invoice_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'reminder',
  sent_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  email_template_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Invoice history
CREATE TABLE public.invoice_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_history ENABLE ROW LEVEL SECURITY;

-- Invoice schedule (recurring)
CREATE TABLE public.invoice_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.commercial_documents(id) ON DELETE CASCADE,
  project_id UUID,
  title TEXT NOT NULL,
  amount_ht NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 20,
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  generated_invoice_id UUID REFERENCES public.invoices(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_schedule ENABLE ROW LEVEL SECURITY;

-- Billing profiles
CREATE TABLE public.billing_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  company_id UUID REFERENCES public.crm_companies(id),
  department_id UUID REFERENCES public.company_departments(id),
  
  -- Legal info
  siret TEXT,
  siren TEXT,
  vat_number TEXT,
  code_naf TEXT,
  legal_form TEXT,
  capital_social NUMERIC,
  rcs_city TEXT,
  
  -- Address
  billing_address TEXT,
  billing_postal_code TEXT,
  billing_city TEXT,
  billing_country TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  billing_name TEXT,
  
  -- Banking
  iban TEXT,
  bic TEXT,
  bank_name TEXT,
  
  -- Defaults
  payment_terms TEXT,
  payment_method TEXT,
  vat_type TEXT,
  vat_rate NUMERIC DEFAULT 20,
  default_discount_percent NUMERIC DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;

-- Pricing grids
CREATE TABLE public.pricing_grids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_grids ENABLE ROW LEVEL SECURITY;
