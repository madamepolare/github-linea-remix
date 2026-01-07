-- Create feedback_entries table for collecting UI feedback
CREATE TABLE public.feedback_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  route_path TEXT NOT NULL,
  content TEXT NOT NULL,
  feedback_type TEXT DEFAULT 'suggestion',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view feedback in their workspace"
ON public.feedback_entries
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create feedback in their workspace"
ON public.feedback_entries
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own feedback"
ON public.feedback_entries
FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own feedback"
ON public.feedback_entries
FOR DELETE
USING (author_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_feedback_entries_updated_at
BEFORE UPDATE ON public.feedback_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();