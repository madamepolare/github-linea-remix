-- Add interview panel support (jury/participants for evaluations)
ALTER TABLE public.team_evaluations 
ADD COLUMN IF NOT EXISTS panel_members uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback jsonb DEFAULT '{}';

-- Create a table to track evaluation participants feedback
CREATE TABLE IF NOT EXISTS public.evaluation_panel_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id uuid REFERENCES public.team_evaluations(id) ON DELETE CASCADE NOT NULL,
    panel_member_id uuid NOT NULL,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    feedback_text text,
    strengths text[],
    improvements text[],
    rating integer CHECK (rating >= 1 AND rating <= 5),
    recommendation text, -- promote, maintain, watch, other
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(evaluation_id, panel_member_id)
);

-- Enable RLS
ALTER TABLE public.evaluation_panel_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for evaluation_panel_feedback
CREATE POLICY "Users can view feedback for their workspace evaluations"
ON public.evaluation_panel_feedback FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Panel members can insert their feedback"
ON public.evaluation_panel_feedback FOR INSERT
WITH CHECK (
    panel_member_id = auth.uid() AND
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Panel members can update their own feedback"
ON public.evaluation_panel_feedback FOR UPDATE
USING (panel_member_id = auth.uid());

-- Add skills/competencies table for evaluations
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'general', -- technical, soft_skills, leadership, etc.
    weight integer DEFAULT 1,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view criteria"
ON public.evaluation_criteria FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage criteria"
ON public.evaluation_criteria FOR ALL
USING (
    workspace_id IN (
        SELECT wm.workspace_id FROM public.workspace_members wm
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_evaluation_panel_feedback_evaluation 
ON public.evaluation_panel_feedback(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_team_evaluations_panel 
ON public.team_evaluations USING GIN (panel_members);