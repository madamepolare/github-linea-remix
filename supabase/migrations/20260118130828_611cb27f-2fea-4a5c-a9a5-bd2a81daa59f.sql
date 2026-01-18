-- Fix security definer view by recreating it with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.workspace_usage_stats;

CREATE VIEW public.workspace_usage_stats 
WITH (security_invoker = true) AS
SELECT 
  workspace_id,
  usage_type,
  service_name,
  COUNT(*) as call_count,
  SUM(tokens_used) as total_tokens,
  SUM(credits_used) as total_credits,
  DATE_TRUNC('month', created_at) as month
FROM public.workspace_usage_logs
GROUP BY workspace_id, usage_type, service_name, DATE_TRUNC('month', created_at);

-- Re-grant access
GRANT SELECT ON public.workspace_usage_stats TO authenticated;