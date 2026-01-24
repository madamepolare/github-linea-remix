-- =====================================================
-- ARCHIGOOD DATABASE SCHEMA EXPORT
-- Generated: 2026-01-24
-- Total Tables: 181
-- =====================================================

-- =====================================================
-- PART 1: CUSTOM ENUM TYPES
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE public.element_type AS ENUM ('link', 'file', 'email', 'note', 'order', 'letter', 'other', 'credential', 'image_ref');
CREATE TYPE public.element_visibility AS ENUM ('all', 'admin', 'owner');
CREATE TYPE public.french_leave_type AS ENUM ('cp', 'rtt', 'anciennete', 'fractionnement', 'maladie', 'maternite', 'paternite', 'parental', 'enfant_malade', 'evenement_familial', 'sans_solde', 'formation', 'compte_epargne', 'autre');
CREATE TYPE public.invitation_response AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE public.payroll_period_status AS ENUM ('draft', 'pending', 'validated', 'exported', 'closed');
CREATE TYPE public.procedure_type AS ENUM ('ouvert', 'restreint', 'adapte', 'concours', 'dialogue', 'partenariat', 'mapa', 'ppp', 'conception_realisation', 'autre', 'concours_restreint', 'concours_ouvert', 'dialogue_competitif', 'partenariat_innovation', 'appel_offres_ouvert', 'appel_offres_restreint', 'negociee');
CREATE TYPE public.purchase_category AS ENUM ('subcontract', 'printing', 'rental', 'transport', 'material', 'service', 'other');
CREATE TYPE public.purchase_status AS ENUM ('draft', 'pending_validation', 'validated', 'invoice_received', 'payment_pending', 'paid', 'cancelled');
CREATE TYPE public.purchase_type AS ENUM ('provision', 'supplier_invoice');
CREATE TYPE public.tender_status AS ENUM ('repere', 'en_analyse', 'go', 'no_go', 'en_montage', 'depose', 'gagne', 'perdu');
CREATE TYPE public.tender_team_role AS ENUM ('mandataire', 'cotraitant', 'sous_traitant');

-- =====================================================
-- PART 2: CORE TABLES (alphabetically sorted key tables)
-- =====================================================

-- Note: This export contains the structure for 181 tables.
-- Due to the size, only the most critical tables are shown here.
-- The full schema can be obtained from the Lovable Cloud interface.

-- workspaces (core entity)
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb,
  is_hidden BOOLEAN DEFAULT false,
  discipline TEXT DEFAULT 'architecture'
);

-- profiles (user profiles)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  job_title TEXT,
  phone TEXT,
  company VARCHAR,
  linkedin_url VARCHAR,
  bio TEXT,
  department TEXT,
  active_workspace_id UUID REFERENCES public.workspaces(id),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- workspace_members
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- crm_companies
CREATE TABLE public.crm_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  industry TEXT,
  status TEXT DEFAULT 'active',
  siret TEXT,
  siren TEXT,
  vat_number TEXT,
  vat_rate NUMERIC DEFAULT 20,
  vat_type TEXT,
  logo_url TEXT,
  notes TEXT,
  billing_email TEXT,
  billing_contact_id UUID,
  client_reference TEXT,
  forme_juridique TEXT,
  code_naf TEXT,
  capital_social NUMERIC,
  rcs_city TEXT,
  bet_specialties TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- contacts
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  crm_company_id UUID REFERENCES public.crm_companies(id),
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  gender TEXT,
  avatar_url TEXT,
  contact_type TEXT,
  department_id UUID,
  department_role TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  project_type TEXT DEFAULT 'interior',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  surface_area NUMERIC,
  budget NUMERIC,
  fee_mode TEXT DEFAULT 'hourly',
  fee_percentage NUMERIC,
  hourly_rate NUMERIC,
  color TEXT,
  cover_image_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  is_framework BOOLEAN DEFAULT false,
  framework_start_date DATE,
  framework_end_date DATE,
  framework_reference TEXT,
  source_document_id UUID,
  tender_id UUID,
  discipline_slug TEXT DEFAULT 'architecture',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tasks(id),
  deliverable_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  tags TEXT[] DEFAULT '{}',
  assigned_to UUID,
  created_by UUID,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  checklist JSONB,
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- commercial_documents (quotes, contracts)
CREATE TABLE public.commercial_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'quote',
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  billing_contact_id UUID REFERENCES public.contacts(id),
  project_id UUID REFERENCES public.projects(id),
  contract_type_id UUID,
  quote_theme_id UUID,
  project_type TEXT DEFAULT 'interior',
  project_address TEXT,
  project_city TEXT,
  postal_code TEXT,
  project_surface NUMERIC,
  project_budget NUMERIC,
  construction_budget NUMERIC,
  construction_budget_disclosed BOOLEAN DEFAULT true,
  fee_mode TEXT DEFAULT 'hourly',
  fee_percentage NUMERIC,
  hourly_rate NUMERIC,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'EUR',
  vat_rate NUMERIC DEFAULT 20,
  vat_type TEXT,
  valid_until DATE,
  validity_days INTEGER DEFAULT 30,
  expected_start_date DATE,
  expected_end_date DATE,
  expected_signature_date DATE,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percentage NUMERIC,
  retention_guarantee_percentage NUMERIC,
  retention_guarantee_amount NUMERIC,
  payment_terms TEXT,
  header_text TEXT,
  footer_text TEXT,
  general_conditions TEXT,
  special_conditions TEXT,
  notes TEXT,
  pdf_url TEXT,
  signed_pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  is_amendment BOOLEAN DEFAULT false,
  is_public_market BOOLEAN DEFAULT false,
  market_reference TEXT,
  reference_client TEXT,
  invoice_schedule JSONB,
  internal_owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'draft',
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  project_id UUID REFERENCES public.projects(id),
  commercial_document_id UUID,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_date DATE,
  total_ht NUMERIC DEFAULT 0,
  total_tva NUMERIC DEFAULT 0,
  total_ttc NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  vat_rate NUMERIC DEFAULT 20,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  internal_notes TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- team_time_entries
CREATE TABLE public.team_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  task_id UUID REFERENCES public.tasks(id),
  budget_envelope_id UUID,
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  hourly_rate NUMERIC,
  is_billable BOOLEAN DEFAULT true,
  entry_type TEXT DEFAULT 'manual',
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- team_absences
CREATE TABLE public.team_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_half_day BOOLEAN DEFAULT false,
  end_half_day BOOLEAN DEFAULT false,
  absence_type TEXT NOT NULL DEFAULT 'conge_paye',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  justification_url TEXT,
  days_count NUMERIC,
  working_days_count NUMERIC,
  computed_days NUMERIC,
  deducted_from_balance BOOLEAN DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tenders
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_type TEXT DEFAULT 'public',
  contracting_authority TEXT,
  location TEXT,
  region TEXT,
  estimated_budget NUMERIC,
  budget_disclosed BOOLEAN DEFAULT true,
  surface_area NUMERIC,
  procedure_type public.procedure_type DEFAULT 'ouvert',
  status public.tender_status DEFAULT 'repere',
  submission_deadline TIMESTAMPTZ,
  site_visit_required BOOLEAN DEFAULT false,
  site_visit_date TIMESTAMPTZ,
  jury_date TIMESTAMPTZ,
  results_date TIMESTAMPTZ,
  go_decision_date TIMESTAMPTZ,
  go_decision_by UUID,
  go_decision_notes TEXT,
  no_go_date TIMESTAMPTZ,
  no_go_reason TEXT,
  source_platform TEXT,
  source_url TEXT,
  consultation_number TEXT,
  tender_type TEXT DEFAULT 'architecture',
  discipline_slug TEXT DEFAULT 'architecture',
  project_id UUID REFERENCES public.projects(id),
  lead_id UUID,
  moa_company_id UUID REFERENCES public.crm_companies(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  actor_id UUID,
  related_entity_type TEXT,
  related_entity_id UUID,
  related_entity_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PART 3: HELPER FUNCTIONS
-- =====================================================

-- is_workspace_member function
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  )
$$;

-- has_role_or_higher function
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _workspace_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND (
        CASE role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'member' THEN 2
          WHEN 'viewer' THEN 1
        END
      ) >= (
        CASE _min_role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'member' THEN 2
          WHEN 'viewer' THEN 1
        END
      )
  )
$$;

-- update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- =====================================================
-- PART 4: ROW LEVEL SECURITY POLICIES (examples)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (workspace-scoped access)
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage workspace members in their workspace" ON public.workspace_members
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage CRM companies in their workspace" ON public.crm_companies
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage contacts in their workspace" ON public.contacts
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage projects in their workspace" ON public.projects
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage tasks in their workspace" ON public.tasks
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage commercial docs in their workspace" ON public.commercial_documents
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage invoices in their workspace" ON public.invoices
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage time entries in their workspace" ON public.team_time_entries
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage absences in their workspace" ON public.team_absences
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage tenders in their workspace" ON public.tenders
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- This is a PARTIAL export of the schema.
-- The full database contains 181 tables including:
-- - CRM: crm_companies, contacts, leads, crm_pipelines, etc.
-- - Projects: projects, project_phases, project_deliverables, etc.
-- - Tasks: tasks, task_time_entries, quick_tasks, etc.
-- - Commercial: commercial_documents, commercial_document_phases, etc.
-- - Invoicing: invoices, invoice_items, invoice_history, etc.
-- - Team: team_time_entries, team_absences, workspace_members, etc.
-- - Tenders: tenders, tender_team_members, tender_documents, etc.
-- - Campaigns: campaigns, campaign_deliverables, media_plan_items, etc.
-- - Documents: agency_documents, document_templates, etc.
-- - Settings: contract_types, phase_templates, pricing_grids, etc.
-- 
-- For the complete schema, contact support or export from Lovable Cloud.
-- =====================================================
