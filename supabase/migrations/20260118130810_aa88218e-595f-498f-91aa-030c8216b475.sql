-- Create workspace_usage_logs table to track AI and API usage
CREATE TABLE public.workspace_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  usage_type TEXT NOT NULL, -- 'ai_credits', 'api_call', 'storage', etc.
  service_name TEXT NOT NULL, -- 'ai-planning', 'contact-import', 'email-send', etc.
  tokens_used INTEGER DEFAULT 0,
  credits_used NUMERIC(10,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_workspace_usage_logs_workspace_id ON public.workspace_usage_logs(workspace_id);
CREATE INDEX idx_workspace_usage_logs_created_at ON public.workspace_usage_logs(created_at);
CREATE INDEX idx_workspace_usage_logs_type ON public.workspace_usage_logs(usage_type);

-- Enable RLS
ALTER TABLE public.workspace_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow workspace members to view their workspace's usage
CREATE POLICY "Workspace members can view usage logs"
ON public.workspace_usage_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_usage_logs.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Allow system (via service role) or authenticated users to insert logs for their workspace
CREATE POLICY "Authenticated users can insert usage logs for their workspace"
ON public.workspace_usage_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_usage_logs.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Create a view for aggregated usage stats
CREATE OR REPLACE VIEW public.workspace_usage_stats AS
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

-- Grant access to the view
GRANT SELECT ON public.workspace_usage_stats TO authenticated;