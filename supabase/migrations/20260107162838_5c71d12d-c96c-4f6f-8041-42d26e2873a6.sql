-- Add required_team column to store required specialties for the tender
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS required_team jsonb DEFAULT '[]'::jsonb;