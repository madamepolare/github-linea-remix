-- Add new columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS brief TEXT,
ADD COLUMN IF NOT EXISTS related_type TEXT,
ADD COLUMN IF NOT EXISTS related_id UUID,
ADD COLUMN IF NOT EXISTS crm_company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create task_exchanges table for back-and-forth discussions
CREATE TABLE IF NOT EXISTS public.task_exchanges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on task_exchanges
ALTER TABLE public.task_exchanges ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_exchanges
CREATE POLICY "Workspace members can view exchanges"
ON public.task_exchanges FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create exchanges"
ON public.task_exchanges FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update exchanges"
ON public.task_exchanges FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete exchanges"
ON public.task_exchanges FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));

-- Create quick_tasks table
CREATE TABLE IF NOT EXISTS public.quick_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on quick_tasks
ALTER TABLE public.quick_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for quick_tasks
CREATE POLICY "Workspace members can view quick tasks"
ON public.quick_tasks FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create quick tasks"
ON public.quick_tasks FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update quick tasks"
ON public.quick_tasks FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete quick tasks"
ON public.quick_tasks FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));