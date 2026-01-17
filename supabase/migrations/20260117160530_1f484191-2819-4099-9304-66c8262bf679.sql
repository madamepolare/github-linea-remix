-- Add project_category column for commercial/billing model classification
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_category text DEFAULT 'standard';

-- Create constraint for valid category values
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_category_check;
ALTER TABLE projects ADD CONSTRAINT projects_category_check 
  CHECK (project_category IN ('standard', 'internal', 'monthly_fee', 'maintenance'));

-- Add columns specific to certain categories
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_budget numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false;

-- Migrate existing internal projects
UPDATE projects SET project_category = 'internal' WHERE is_internal = true;

-- Add index for filtering by category
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(project_category);