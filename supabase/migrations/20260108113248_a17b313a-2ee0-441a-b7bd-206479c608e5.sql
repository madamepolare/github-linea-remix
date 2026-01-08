-- Create table for planned actions/alerts
CREATE TABLE public.pipeline_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.contact_pipeline_entries(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL DEFAULT 'task', -- 'email', 'call', 'meeting', 'task', 'followup'
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'overdue'
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view pipeline actions in their workspace"
ON public.pipeline_actions FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pipeline actions in their workspace"
ON public.pipeline_actions FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pipeline actions in their workspace"
ON public.pipeline_actions FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pipeline actions in their workspace"
ON public.pipeline_actions FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_pipeline_actions_entry_id ON public.pipeline_actions(entry_id);
CREATE INDEX idx_pipeline_actions_due_date ON public.pipeline_actions(due_date) WHERE status = 'pending';
CREATE INDEX idx_pipeline_actions_workspace_id ON public.pipeline_actions(workspace_id);

-- Trigger for updated_at
CREATE TRIGGER update_pipeline_actions_updated_at
BEFORE UPDATE ON public.pipeline_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();