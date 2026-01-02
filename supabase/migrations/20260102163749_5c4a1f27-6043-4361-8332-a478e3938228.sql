-- Create table for project calendar events (meetings, milestones)
CREATE TABLE public.project_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting', -- meeting, milestone, reminder
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  -- Google Calendar integration
  google_event_id TEXT,
  google_meet_link TEXT,
  google_calendar_id TEXT,
  -- Attendees as JSON array
  attendees JSONB DEFAULT '[]',
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.project_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view calendar events in their workspace" 
ON public.project_calendar_events 
FOR SELECT 
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can create calendar events in their workspace" 
ON public.project_calendar_events 
FOR INSERT 
WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can update calendar events in their workspace" 
ON public.project_calendar_events 
FOR UPDATE 
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

CREATE POLICY "Users can delete calendar events in their workspace" 
ON public.project_calendar_events 
FOR DELETE 
USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_calendar_events_updated_at
BEFORE UPDATE ON public.project_calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table for storing Google OAuth tokens per user/workspace
CREATE TABLE public.google_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS on tokens table
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for tokens - users can only access their own tokens
CREATE POLICY "Users can view their own Google tokens" 
ON public.google_calendar_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google tokens" 
ON public.google_calendar_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens" 
ON public.google_calendar_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google tokens" 
ON public.google_calendar_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE TRIGGER update_google_calendar_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();