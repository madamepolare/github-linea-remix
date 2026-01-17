-- Create team_channels table
CREATE TABLE public.team_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'public' CHECK (channel_type IN ('public', 'private', 'direct')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Create index on workspace_id
CREATE INDEX idx_team_channels_workspace ON public.team_channels(workspace_id);

-- Create team_channel_members table
CREATE TABLE public.team_channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create index on channel_id
CREATE INDEX idx_team_channel_members_channel ON public.team_channel_members(channel_id);
CREATE INDEX idx_team_channel_members_user ON public.team_channel_members(user_id);

-- Create team_messages table
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.team_messages(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_edited BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes
CREATE INDEX idx_team_messages_channel ON public.team_messages(channel_id);
CREATE INDEX idx_team_messages_parent ON public.team_messages(parent_id);
CREATE INDEX idx_team_messages_workspace ON public.team_messages(workspace_id);
CREATE INDEX idx_team_messages_created ON public.team_messages(created_at DESC);

-- Create team_message_reactions table
CREATE TABLE public.team_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create index
CREATE INDEX idx_team_message_reactions_message ON public.team_message_reactions(message_id);

-- Enable RLS on all tables
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_channels
CREATE POLICY "Users can view channels in their workspace"
ON public.team_channels FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels in their workspace"
ON public.team_channels FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Channel admins can update channels"
ON public.team_channels FOR UPDATE
USING (
  created_by = auth.uid() OR
  id IN (
    SELECT channel_id FROM public.team_channel_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Channel admins can delete channels"
ON public.team_channels FOR DELETE
USING (
  created_by = auth.uid()
);

-- RLS Policies for team_channel_members
CREATE POLICY "Users can view channel members"
ON public.team_channel_members FOR SELECT
USING (
  channel_id IN (
    SELECT id FROM public.team_channels WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can join public channels"
ON public.team_channel_members FOR INSERT
WITH CHECK (
  channel_id IN (
    SELECT id FROM public.team_channels WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own membership"
ON public.team_channel_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can leave channels"
ON public.team_channel_members FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for team_messages
CREATE POLICY "Users can view messages in their workspace"
ON public.team_messages FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages"
ON public.team_messages FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.team_messages FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.team_messages FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for team_message_reactions
CREATE POLICY "Users can view reactions"
ON public.team_message_reactions FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add reactions"
ON public.team_message_reactions FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.team_message_reactions FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for team_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- Create trigger for updated_at on team_channels
CREATE TRIGGER update_team_channels_updated_at
BEFORE UPDATE ON public.team_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on team_messages
CREATE TRIGGER update_team_messages_updated_at
BEFORE UPDATE ON public.team_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();