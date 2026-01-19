-- Add "pending" status to team_evaluations for auto-generated evaluations
-- This allows distinguishing between scheduled (confirmed) and pending (suggested) evaluations

-- First, let's update the status check if there's a constraint
-- The status column already accepts any text, so we just need to handle this in the app

-- Create index for faster queries on pending evaluations
CREATE INDEX IF NOT EXISTS idx_team_evaluations_pending 
ON public.team_evaluations(workspace_id, status) 
WHERE status = 'pending';