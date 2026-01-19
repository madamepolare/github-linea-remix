
-- Update status constraint to include 'pending'
ALTER TABLE team_evaluations DROP CONSTRAINT IF EXISTS team_evaluations_status_check;
ALTER TABLE team_evaluations ADD CONSTRAINT team_evaluations_status_check 
  CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'));

-- Also make scheduled_date nullable for pending evaluations
ALTER TABLE team_evaluations ALTER COLUMN scheduled_date DROP NOT NULL;
