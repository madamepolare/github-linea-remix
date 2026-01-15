-- Add email_ai_prompt column to crm_pipeline_stages for per-stage email prompts
ALTER TABLE public.crm_pipeline_stages ADD COLUMN IF NOT EXISTS email_ai_prompt TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.crm_pipeline_stages.email_ai_prompt IS 'AI prompt for generating emails when entering this stage';