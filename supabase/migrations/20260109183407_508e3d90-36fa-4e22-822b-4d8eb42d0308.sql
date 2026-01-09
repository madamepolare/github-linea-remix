-- Add custom client daily rate per project member
ALTER TABLE public.project_members
ADD COLUMN client_daily_rate numeric NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.project_members.client_daily_rate IS 'Custom client daily rate for this member on this project. If NULL, uses workspace default rate.';