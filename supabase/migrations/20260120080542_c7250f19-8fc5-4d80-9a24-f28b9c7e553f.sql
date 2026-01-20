-- Create feedback table for roadmap items
CREATE TABLE public.roadmap_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_item_id UUID REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.roadmap_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view feedback in their workspace"
  ON public.roadmap_feedback FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create feedback"
  ON public.roadmap_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own feedback"
  ON public.roadmap_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.roadmap_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_roadmap_feedback_item ON public.roadmap_feedback(roadmap_item_id);
CREATE INDEX idx_roadmap_feedback_workspace ON public.roadmap_feedback(workspace_id);

-- Trigger for updated_at
CREATE TRIGGER update_roadmap_feedback_updated_at
  BEFORE UPDATE ON public.roadmap_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();