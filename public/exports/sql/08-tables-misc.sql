-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 8: MISC TABLES
-- =====================================================
-- Tenders, Documents, Communications, etc.
-- =====================================================

-- Disciplines (for tenders)
CREATE TABLE public.disciplines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;

-- Discipline modules
CREATE TABLE public.discipline_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.discipline_modules ENABLE ROW LEVEL SECURITY;

-- Tenders
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  reference TEXT,
  description TEXT,
  
  -- Status
  pipeline_status tender_status DEFAULT 'repere',
  no_go_date DATE,
  no_go_reason TEXT,
  
  -- Client
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  
  -- Type
  discipline_id UUID REFERENCES public.disciplines(id),
  procedure_type procedure_type DEFAULT 'ouvert',
  is_public_market BOOLEAN DEFAULT true,
  
  -- Location
  location TEXT,
  city TEXT,
  postal_code TEXT,
  department TEXT,
  region TEXT,
  
  -- Project details
  project_surface NUMERIC,
  construction_budget NUMERIC,
  
  -- Dates
  publication_date DATE,
  submission_deadline TIMESTAMPTZ,
  response_deadline DATE,
  estimated_start DATE,
  estimated_end DATE,
  
  -- Team
  lead_company_id UUID REFERENCES public.crm_companies(id),
  team_role tender_team_role DEFAULT 'mandataire',
  
  -- Financials
  estimated_fee NUMERIC,
  fee_percentage NUMERIC,
  
  -- Files
  dce_url TEXT,
  response_url TEXT,
  
  -- Metadata
  source TEXT,
  source_url TEXT,
  tags TEXT[],
  notes TEXT,
  
  -- Outcome
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  converted_project_id UUID REFERENCES public.projects(id),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Tender team (partners)
CREATE TABLE public.tender_team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.crm_companies(id),
  contact_id UUID REFERENCES public.contacts(id),
  role tender_team_role DEFAULT 'cotraitant',
  specialty TEXT,
  fee_percentage NUMERIC,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tender_team ENABLE ROW LEVEL SECURITY;

-- Tender documents
CREATE TABLE public.tender_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;

-- Tender synthesis
CREATE TABLE public.tender_synthesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  block_label TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tender_synthesis ENABLE ROW LEVEL SECURITY;

-- Tender evaluation criteria
CREATE TABLE public.tender_evaluation_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC DEFAULT 1,
  our_score NUMERIC,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tender_evaluation_criteria ENABLE ROW LEVEL SECURITY;

-- Communications (unified comments/notes)
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  context_entity_type TEXT,
  context_entity_id UUID,
  parent_id UUID REFERENCES public.communications(id) ON DELETE CASCADE,
  thread_id TEXT,
  
  communication_type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  mentions UUID[],
  
  email_metadata JSONB,
  sent_via TEXT,
  workspace_email_account_id UUID,
  
  is_pinned BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Communication reactions
CREATE TABLE public.communication_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(communication_id, user_id, emoji)
);

ALTER TABLE public.communication_reactions ENABLE ROW LEVEL SECURITY;

-- Entity activities (audit log)
CREATE TABLE public.entity_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.entity_activities ENABLE ROW LEVEL SECURITY;

-- Document templates
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  document_type TEXT,
  content_html TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Agency documents (internal docs)
CREATE TABLE public.agency_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  document_number TEXT,
  description TEXT,
  project_id UUID REFERENCES public.projects(id),
  contact_id UUID REFERENCES public.contacts(id),
  company_id UUID REFERENCES public.crm_companies(id),
  related_document_id UUID,
  content JSONB DEFAULT '{}'::jsonb,
  template_id UUID REFERENCES public.document_templates(id),
  pdf_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  valid_from DATE,
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agency_documents ENABLE ROW LEVEL SECURITY;

-- Document workflows
CREATE TABLE public.document_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_types TEXT[],
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_workflows ENABLE ROW LEVEL SECURITY;

-- Document signatures
CREATE TABLE public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT DEFAULT 'pending',
  signer_name TEXT,
  signer_email TEXT,
  signer_company TEXT,
  signed_at TIMESTAMPTZ,
  signature_ip TEXT,
  signature_data JSONB,
  expires_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- Gmail connections
CREATE TABLE public.gmail_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  history_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;

-- Workspace email accounts (shared)
CREATE TABLE public.workspace_email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  gmail_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  connected_by UUID REFERENCES auth.users(id),
  last_sync_at TIMESTAMPTZ,
  history_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, gmail_email)
);

ALTER TABLE public.workspace_email_accounts ENABLE ROW LEVEL SECURITY;

-- Calendar connections
CREATE TABLE public.calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  provider_account_email TEXT,
  provider_account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_shared BOOLEAN DEFAULT false,
  calendar_name TEXT NOT NULL DEFAULT 'Mon calendrier',
  calendar_color TEXT DEFAULT '#3B82F6',
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT DEFAULT 'import',
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- Dashboard layouts
CREATE TABLE public.dashboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_type TEXT NOT NULL DEFAULT 'main',
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id, dashboard_type)
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Knowledge base entries
CREATE TABLE public.knowledge_base_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;

-- Roadmap items
CREATE TABLE public.roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  votes_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- Roadmap ideas (user suggestions)
CREATE TABLE public.roadmap_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'submitted',
  votes_count INTEGER DEFAULT 0,
  promoted_to_item_id UUID REFERENCES public.roadmap_items(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roadmap_ideas ENABLE ROW LEVEL SECURITY;

-- Roadmap votes
CREATE TABLE public.roadmap_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.roadmap_ideas(id) ON DELETE CASCADE,
  vote_type TEXT DEFAULT 'upvote',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, roadmap_item_id),
  UNIQUE(user_id, idea_id)
);

ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Roadmap feedback
CREATE TABLE public.roadmap_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.roadmap_ideas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.roadmap_feedback ENABLE ROW LEVEL SECURITY;

-- Feedback entries (general feedback)
CREATE TABLE public.feedback_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  content TEXT NOT NULL,
  rating INTEGER,
  page_url TEXT,
  browser_info JSONB,
  status TEXT DEFAULT 'new',
  response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  client_company_id UUID REFERENCES public.crm_companies(id),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'other',
  status TEXT DEFAULT 'draft',
  color TEXT,
  tags TEXT[],
  
  -- Dates
  start_date DATE,
  end_date DATE,
  launch_date DATE,
  
  -- Budget
  budget_total NUMERIC,
  budget_spent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Content
  brief_content TEXT,
  brief_attachments JSONB DEFAULT '[]'::jsonb,
  objectives JSONB DEFAULT '[]'::jsonb,
  target_kpis JSONB DEFAULT '[]'::jsonb,
  actual_kpis JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Campaign deliverables
CREATE TABLE public.campaign_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deliverable_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  due_date DATE,
  files JSONB DEFAULT '[]'::jsonb,
  preview_url TEXT,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaign_deliverables ENABLE ROW LEVEL SECURITY;

-- Client portal links
CREATE TABLE public.client_portal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  framework_project_id UUID REFERENCES public.projects(id),
  token TEXT NOT NULL UNIQUE,
  custom_slug TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  project_ids TEXT[],
  
  -- Permissions
  can_view_projects BOOLEAN DEFAULT true,
  can_view_tasks BOOLEAN DEFAULT true,
  can_add_tasks BOOLEAN DEFAULT false,
  can_view_quotes BOOLEAN DEFAULT true,
  can_view_invoices BOOLEAN DEFAULT true,
  can_view_time_entries BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_portal_links ENABLE ROW LEVEL SECURITY;

-- Company portal links
CREATE TABLE public.company_portal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  custom_slug TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  project_ids TEXT[],
  
  -- Permissions
  can_view_projects BOOLEAN DEFAULT true,
  can_view_contacts BOOLEAN DEFAULT true,
  can_view_tasks BOOLEAN DEFAULT true,
  can_add_tasks BOOLEAN DEFAULT false,
  can_view_quotes BOOLEAN DEFAULT true,
  can_view_invoices BOOLEAN DEFAULT true,
  can_view_time_entries BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_portal_links ENABLE ROW LEVEL SECURITY;

-- Plans (subscription)
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC,
  price_yearly NUMERIC,
  currency TEXT DEFAULT 'EUR',
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
