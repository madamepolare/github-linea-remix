-- Add email AI prompt configuration to pipelines
ALTER TABLE public.crm_pipelines 
  ADD COLUMN IF NOT EXISTS email_ai_prompt TEXT DEFAULT NULL;