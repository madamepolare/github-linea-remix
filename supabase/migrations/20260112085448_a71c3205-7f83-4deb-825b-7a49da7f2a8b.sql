-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'users',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members junction table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
CREATE POLICY "Users can view teams in their workspace"
ON public.teams
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create teams"
ON public.teams
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update teams"
ON public.teams
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete teams"
ON public.teams
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- RLS policies for team_members
CREATE POLICY "Users can view team members in their workspace"
ON public.team_members
FOR SELECT
USING (
  team_id IN (
    SELECT t.id FROM public.teams t
    JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (
  team_id IN (
    SELECT t.id FROM public.teams t
    JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
    WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();