-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 6: PROJECT TABLES
-- =====================================================
-- Projects, Tasks, Phases, Deliverables
-- =====================================================

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  
  -- Type and category
  project_type TEXT DEFAULT 'other',
  category TEXT,
  sub_category TEXT,
  
  -- Client info
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  
  -- Location
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Project details
  surface NUMERIC,
  budget NUMERIC,
  estimated_hours NUMERIC,
  hourly_rate NUMERIC,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  deadline DATE,
  completed_at TIMESTAMPTZ,
  
  -- Financial
  total_revenue NUMERIC DEFAULT 0,
  total_costs NUMERIC DEFAULT 0,
  profit_margin NUMERIC,
  
  -- Settings
  color TEXT,
  icon TEXT,
  cover_image_url TEXT,
  is_template BOOLEAN DEFAULT false,
  template_id UUID,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  
  -- Tags and metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Project members
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  responsibilities TEXT,
  hours_allocated NUMERIC,
  client_daily_rate NUMERIC,
  is_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Project contacts
CREATE TABLE public.project_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, contact_id)
);

ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

-- Project phases
CREATE TABLE public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  progress NUMERIC DEFAULT 0,
  
  -- Dates
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  
  -- Budget
  budget_hours NUMERIC,
  budget_amount NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  
  -- Display
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- Dependencies
  depends_on UUID[],
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

-- Phase dependencies
CREATE TABLE public.phase_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  depends_on_phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start',
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phase_id, depends_on_phase_id)
);

ALTER TABLE public.phase_dependencies ENABLE ROW LEVEL SECURITY;

-- Phase templates
CREATE TABLE public.phase_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  default_duration_days INTEGER,
  default_budget_hours NUMERIC,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  deliverables JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.phase_templates ENABLE ROW LEVEL SECURITY;

-- Phase template project types mapping
CREATE TABLE public.phase_template_project_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_template_id UUID NOT NULL REFERENCES public.phase_templates(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phase_template_id, project_type)
);

ALTER TABLE public.phase_template_project_types ENABLE ROW LEVEL SECURITY;

-- Project deliverables
CREATE TABLE public.project_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT DEFAULT 'document',
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  
  -- Dates
  due_date TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  -- Files
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  
  -- Tracking
  version INTEGER DEFAULT 1,
  revision_notes TEXT,
  
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;

-- Deliverable templates
CREATE TABLE public.deliverable_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT DEFAULT 'document',
  phase_code TEXT,
  default_tasks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deliverable_templates ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES public.project_deliverables(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assignee_ids UUID[],
  
  -- Dates
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Time tracking
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  
  -- Display
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  
  -- Tags and labels
  tags TEXT[],
  labels JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Task completed_at trigger
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at = NOW();
  END IF;
  
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_task_completed_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_task_completed_at();

-- Task dependencies
CREATE TABLE public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Task comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  mentions UUID[],
  parent_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Task exchanges (client communication)
CREATE TABLE public.task_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  exchange_type TEXT DEFAULT 'message',
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_exchanges ENABLE ROW LEVEL SECURITY;

-- Task time entries
CREATE TABLE public.task_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;

-- Task schedules (recurring)
CREATE TABLE public.task_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  recurrence_rule TEXT NOT NULL,
  next_occurrence DATE,
  last_occurrence DATE,
  task_template JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_schedules ENABLE ROW LEVEL SECURITY;

-- Quick tasks (personal)
CREATE TABLE public.quick_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quick_tasks ENABLE ROW LEVEL SECURITY;

-- Quick task shares
CREATE TABLE public.quick_task_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quick_task_id UUID NOT NULL REFERENCES public.quick_tasks(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quick_task_id, shared_with_user_id)
);

ALTER TABLE public.quick_task_shares ENABLE ROW LEVEL SECURITY;

-- Project calendar events
CREATE TABLE public.project_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.project_deliverables(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'milestone',
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,
  color TEXT,
  location TEXT,
  attendees UUID[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_calendar_events ENABLE ROW LEVEL SECURITY;

-- Project meetings
CREATE TABLE public.project_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'chantier',
  status TEXT DEFAULT 'scheduled',
  
  -- Date/time
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Location
  location TEXT,
  video_link TEXT,
  
  -- Participants
  organizer_id UUID REFERENCES auth.users(id),
  attendee_ids UUID[],
  external_attendees JSONB DEFAULT '[]'::jsonb,
  
  -- Agenda
  agenda_items JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  decisions JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  
  -- Files
  attachments JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

-- Meeting reports
CREATE TABLE public.meeting_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.project_meetings(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT,
  attendees_present UUID[],
  attendees_absent UUID[],
  decisions JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  next_meeting_date TIMESTAMPTZ,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meeting_reports ENABLE ROW LEVEL SECURITY;

-- Meeting attention items
CREATE TABLE public.meeting_attention_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.project_meetings(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'point',
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES auth.users(id),
  responsible_company_id UUID REFERENCES public.crm_companies(id),
  due_date DATE,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meeting_attention_items ENABLE ROW LEVEL SECURITY;

-- Project budget envelopes
CREATE TABLE public.project_budget_envelopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  envelope_type TEXT DEFAULT 'mixed',
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  consumed_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_budget_envelopes ENABLE ROW LEVEL SECURITY;

-- Project purchases
CREATE TABLE public.project_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  budget_envelope_id UUID REFERENCES public.project_budget_envelopes(id) ON DELETE SET NULL,
  
  purchase_type purchase_type DEFAULT 'supplier_invoice',
  category purchase_category DEFAULT 'other',
  status purchase_status DEFAULT 'draft',
  
  title TEXT NOT NULL,
  description TEXT,
  supplier_company_id UUID REFERENCES public.crm_companies(id),
  supplier_name TEXT,
  reference TEXT,
  
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC DEFAULT 20,
  amount_ttc NUMERIC,
  
  invoice_date DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  invoice_file_url TEXT,
  notes TEXT,
  
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_purchases ENABLE ROW LEVEL SECURITY;

-- Project elements (attachments, links, notes)
CREATE TABLE public.project_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  
  element_type element_type NOT NULL,
  visibility element_visibility DEFAULT 'all',
  
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  sort_order INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_elements ENABLE ROW LEVEL SECURITY;

-- Project planning versions (snapshots)
CREATE TABLE public.project_planning_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  description TEXT,
  snapshot_data JSONB NOT NULL,
  is_baseline BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_planning_versions ENABLE ROW LEVEL SECURITY;

-- Project enabled modules
CREATE TABLE public.project_enabled_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, module_id)
);

ALTER TABLE public.project_enabled_modules ENABLE ROW LEVEL SECURITY;
