-- Create table for sharing quick tasks with specific users
CREATE TABLE public.quick_task_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quick_task_id UUID NOT NULL REFERENCES public.quick_tasks(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL,
  shared_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quick_task_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE public.quick_task_shares ENABLE ROW LEVEL SECURITY;

-- Policies for quick_task_shares
CREATE POLICY "Users can view shares where they are involved"
ON public.quick_task_shares
FOR SELECT
USING (auth.uid() = shared_with_user_id OR auth.uid() = shared_by_user_id);

CREATE POLICY "Users can create shares for their own tasks"
ON public.quick_task_shares
FOR INSERT
WITH CHECK (
  auth.uid() = shared_by_user_id AND
  EXISTS (SELECT 1 FROM public.quick_tasks WHERE id = quick_task_id AND created_by = auth.uid())
);

CREATE POLICY "Task owners can delete shares"
ON public.quick_task_shares
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.quick_tasks WHERE id = quick_task_id AND created_by = auth.uid())
);

-- Drop existing policies on quick_tasks
DROP POLICY IF EXISTS "Workspace members can create quick tasks" ON public.quick_tasks;
DROP POLICY IF EXISTS "Workspace members can view quick tasks" ON public.quick_tasks;
DROP POLICY IF EXISTS "Workspace members can update quick tasks" ON public.quick_tasks;
DROP POLICY IF EXISTS "Workspace members can delete quick tasks" ON public.quick_tasks;

-- Create new policies: user sees only their own tasks OR tasks shared with them
CREATE POLICY "Users can view their own tasks or shared tasks"
ON public.quick_tasks
FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.quick_task_shares WHERE quick_task_id = id AND shared_with_user_id = auth.uid())
);

CREATE POLICY "Users can create their own quick tasks"
ON public.quick_tasks
FOR INSERT
WITH CHECK (created_by = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update their own quick tasks"
ON public.quick_tasks
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own quick tasks"
ON public.quick_tasks
FOR DELETE
USING (created_by = auth.uid());

-- Add index for performance
CREATE INDEX idx_quick_task_shares_user ON public.quick_task_shares(shared_with_user_id);
CREATE INDEX idx_quick_task_shares_task ON public.quick_task_shares(quick_task_id);
CREATE INDEX idx_quick_tasks_created_by ON public.quick_tasks(created_by);