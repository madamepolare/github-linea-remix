-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  start_date DATE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  tags TEXT[],
  assigned_to UUID[],
  created_by UUID,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task Comments
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[],
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task Time Entries
CREATE TABLE public.task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_billable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task Dependencies
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Workspace members can view tasks" ON public.tasks
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update tasks" ON public.tasks
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete tasks" ON public.tasks
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for task_comments
CREATE POLICY "Workspace members can view comments" ON public.task_comments
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create comments" ON public.task_comments
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update comments" ON public.task_comments
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete comments" ON public.task_comments
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for task_time_entries
CREATE POLICY "Workspace members can view time entries" ON public.task_time_entries
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create time entries" ON public.task_time_entries
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update time entries" ON public.task_time_entries
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete time entries" ON public.task_time_entries
  FOR DELETE USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for task_dependencies
CREATE POLICY "Workspace members can manage dependencies" ON public.task_dependencies
  FOR ALL USING (
    task_id IN (SELECT id FROM public.tasks WHERE is_workspace_member(workspace_id, auth.uid()))
  );

-- Indexes
CREATE INDEX idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX idx_task_time_entries_task ON public.task_time_entries(task_id);

-- Update trigger for tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for task_comments
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();