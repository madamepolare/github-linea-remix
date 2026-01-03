-- Create workspace_settings table for customizable options
CREATE TABLE public.workspace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  setting_type TEXT NOT NULL, -- 'tags', 'pipelines', 'contact_types', 'bet_specialties', 'lead_sources', 'activity_types', 'company_types', 'task_statuses', 'task_priorities'
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, setting_type, setting_key)
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view settings in their workspace"
  ON public.workspace_settings
  FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can create settings in their workspace"
  ON public.workspace_settings
  FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can update settings in their workspace"
  ON public.workspace_settings
  FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can delete settings in their workspace"
  ON public.workspace_settings
  FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Add trigger for updated_at
CREATE TRIGGER update_workspace_settings_updated_at
  BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();