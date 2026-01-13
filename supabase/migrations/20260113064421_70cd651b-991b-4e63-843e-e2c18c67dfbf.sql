-- Table for calendar connections (user or workspace level)
CREATE TABLE public.calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID, -- NULL for shared workspace calendars
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'ical')),
  provider_account_email TEXT,
  provider_account_name TEXT,
  access_token TEXT, -- Encrypted in practice
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_shared BOOLEAN NOT NULL DEFAULT false, -- true = shared workspace calendar
  calendar_name TEXT NOT NULL DEFAULT 'Mon calendrier',
  calendar_color TEXT DEFAULT '#3B82F6',
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_direction TEXT NOT NULL DEFAULT 'import' CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  sync_error TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for synced calendar events from external providers
CREATE TABLE public.synced_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL, -- ID from external provider
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  organizer JSONB,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  visibility TEXT DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private', 'confidential')),
  recurrence_rule TEXT,
  html_link TEXT,
  meeting_link TEXT,
  raw_data JSONB, -- Store full external event data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, external_event_id)
);

-- Table for shared workspace calendars (internal calendars, not external)
CREATE TABLE public.workspace_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10B981',
  icon TEXT DEFAULT 'calendar',
  is_default BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'members', 'admins')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for events in shared workspace calendars
CREATE TABLE public.workspace_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES public.workspace_calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'event' CHECK (event_type IN ('event', 'meeting', 'deadline', 'reminder', 'holiday', 'other')),
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  recurrence_rule TEXT,
  recurrence_end_date DATE,
  color TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_connections
CREATE POLICY "Users can view connections in their workspace"
  ON public.calendar_connections FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage their own connections"
  ON public.calendar_connections FOR ALL
  USING (
    is_workspace_member(workspace_id, auth.uid()) AND
    (user_id = auth.uid() OR is_shared = false)
  );

CREATE POLICY "Admins can manage shared connections"
  ON public.calendar_connections FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) AND is_shared = true
  );

-- RLS Policies for synced_calendar_events
CREATE POLICY "Users can view synced events in their workspace"
  ON public.synced_calendar_events FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "System can manage synced events"
  ON public.synced_calendar_events FOR ALL
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for workspace_calendars
CREATE POLICY "Users can view workspace calendars"
  ON public.workspace_calendars FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can manage workspace calendars"
  ON public.workspace_calendars FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for workspace_calendar_events
CREATE POLICY "Users can view workspace calendar events"
  ON public.workspace_calendar_events FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage workspace calendar events"
  ON public.workspace_calendar_events FOR ALL
  USING (is_workspace_member(workspace_id, auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_synced_calendar_events_updated_at
  BEFORE UPDATE ON public.synced_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_calendars_updated_at
  BEFORE UPDATE ON public.workspace_calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_calendar_events_updated_at
  BEFORE UPDATE ON public.workspace_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_calendar_connections_workspace ON public.calendar_connections(workspace_id);
CREATE INDEX idx_calendar_connections_user ON public.calendar_connections(user_id);
CREATE INDEX idx_synced_calendar_events_workspace ON public.synced_calendar_events(workspace_id);
CREATE INDEX idx_synced_calendar_events_connection ON public.synced_calendar_events(connection_id);
CREATE INDEX idx_synced_calendar_events_dates ON public.synced_calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_workspace_calendars_workspace ON public.workspace_calendars(workspace_id);
CREATE INDEX idx_workspace_calendar_events_calendar ON public.workspace_calendar_events(calendar_id);
CREATE INDEX idx_workspace_calendar_events_dates ON public.workspace_calendar_events(start_datetime, end_datetime);