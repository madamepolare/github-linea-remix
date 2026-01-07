-- Table pour les réactions aux communications
CREATE TABLE public.communication_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  UNIQUE(communication_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.communication_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view reactions in their workspace"
ON public.communication_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = communication_reactions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add reactions"
ON public.communication_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = communication_reactions.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.communication_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_communication_reactions_comm_id ON public.communication_reactions(communication_id);