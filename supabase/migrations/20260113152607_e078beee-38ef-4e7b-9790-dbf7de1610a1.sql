-- Create user_checkins table for daily check-in/check-out tracking
CREATE TABLE public.user_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Check-in data
  checked_in_at TIMESTAMPTZ,
  checkin_notes TEXT,
  
  -- Check-out data
  checked_out_at TIMESTAMPTZ,
  day_quality INTEGER CHECK (day_quality >= 1 AND day_quality <= 5),
  checkout_mood TEXT CHECK (checkout_mood IN ('great', 'good', 'neutral', 'tired', 'stressed')),
  checkout_notes TEXT,
  time_entries_validated BOOLEAN DEFAULT FALSE,
  
  -- Tomorrow notes (from checkout)
  tomorrow_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own checkins"
  ON public.user_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
  ON public.user_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
  ON public.user_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Workspace members can view team checkins
CREATE POLICY "Workspace members can view team checkins"
  ON public.user_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_checkins.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_user_checkins_updated_at
  BEFORE UPDATE ON public.user_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_user_checkins_user_date ON public.user_checkins(user_id, date);
CREATE INDEX idx_user_checkins_workspace_date ON public.user_checkins(workspace_id, date);