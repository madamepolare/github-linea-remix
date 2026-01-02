-- Create table for meeting attention items
CREATE TABLE public.meeting_attention_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.project_meetings(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Assignees: can be "all", specific company ids, or custom names
  assignee_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'specific', 'custom'
  assignee_company_ids UUID[] DEFAULT '{}',
  assignee_names TEXT[] DEFAULT '{}',
  stakeholder_type TEXT NOT NULL DEFAULT 'entreprise', -- 'bet', 'entreprise', 'moa', 'other'
  
  -- Content
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  due_date DATE,
  comment TEXT,
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_attention_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Workspace members can view attention items"
  ON public.meeting_attention_items
  FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create attention items"
  ON public.meeting_attention_items
  FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update attention items"
  ON public.meeting_attention_items
  FOR UPDATE
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete attention items"
  ON public.meeting_attention_items
  FOR DELETE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_meeting_attention_items_meeting ON public.meeting_attention_items(meeting_id);
CREATE INDEX idx_meeting_attention_items_workspace ON public.meeting_attention_items(workspace_id);