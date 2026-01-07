-- Add field to track multiple assigned users for site visits
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS site_visit_assigned_users uuid[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.tenders.site_visit_assigned_users IS 'Array of user IDs assigned to attend the site visit';