-- ============================================
-- LINEA - Campaigns & Media Planning Module
-- ============================================

-- 1. Create campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  client_company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  
  -- Basic info
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL DEFAULT 'multi-channel', -- 'digital', 'print', 'tv', 'radio', 'multi-channel', 'event'
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'planning', 'production', 'live', 'completed', 'archived'
  
  -- Dates
  start_date date,
  end_date date,
  launch_date date,
  
  -- Budget
  budget_total numeric(12,2),
  budget_spent numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'EUR',
  
  -- Objectives & KPIs
  objectives jsonb DEFAULT '[]'::jsonb,
  target_kpis jsonb DEFAULT '{}'::jsonb, -- { "impressions": 1000000, "clicks": 50000, "conversions": 1000 }
  actual_kpis jsonb DEFAULT '{}'::jsonb,
  
  -- Brief
  brief_content text,
  brief_attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Tags & metadata
  tags text[] DEFAULT '{}',
  color text,
  
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view campaigns in their workspace"
ON public.campaigns FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create campaigns in their workspace"
ON public.campaigns FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update campaigns in their workspace"
ON public.campaigns FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete campaigns in their workspace"
ON public.campaigns FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- 2. Create media_channels table (reference table for channels)
CREATE TABLE public.media_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel_type text NOT NULL, -- 'social', 'display', 'search', 'video', 'print', 'tv', 'radio', 'outdoor', 'email', 'other'
  platform text, -- 'facebook', 'instagram', 'linkedin', 'google', 'youtube', etc.
  icon text,
  color text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media channels in their workspace"
ON public.media_channels FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage media channels in their workspace"
ON public.media_channels FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- 3. Create media_plan_items table (individual placements)
CREATE TABLE public.media_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.media_channels(id) ON DELETE SET NULL,
  
  -- Placement info
  title text NOT NULL,
  description text,
  format text, -- 'post', 'story', 'reel', 'banner', 'video', 'article', 'spot', etc.
  
  -- Schedule
  publish_date date NOT NULL,
  publish_time time,
  end_date date,
  
  -- Content
  content_brief text,
  content_url text,
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Budget
  budget numeric(10,2),
  actual_cost numeric(10,2),
  
  -- Status & tracking
  status text DEFAULT 'planned', -- 'planned', 'in_production', 'ready', 'published', 'cancelled'
  performance_data jsonb DEFAULT '{}'::jsonb,
  
  -- Assignment
  assigned_to uuid,
  
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media plan items in their workspace"
ON public.media_plan_items FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create media plan items in their workspace"
ON public.media_plan_items FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update media plan items in their workspace"
ON public.media_plan_items FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete media plan items in their workspace"
ON public.media_plan_items FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- 4. Create campaign_deliverables table
CREATE TABLE public.campaign_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  deliverable_type text NOT NULL, -- 'visual', 'video', 'copy', 'landing_page', 'email', 'document', 'other'
  description text,
  
  -- Status
  status text DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'approved', 'delivered'
  due_date date,
  
  -- Files
  files jsonb DEFAULT '[]'::jsonb,
  preview_url text,
  
  -- Validation
  validated_by uuid,
  validated_at timestamp with time zone,
  validation_notes text,
  
  -- Assignment
  assigned_to uuid,
  
  sort_order integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign deliverables in their workspace"
ON public.campaign_deliverables FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage campaign deliverables in their workspace"
ON public.campaign_deliverables FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- 5. Add triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_plan_items_updated_at
BEFORE UPDATE ON public.media_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_deliverables_updated_at
BEFORE UPDATE ON public.campaign_deliverables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create indexes for performance
CREATE INDEX idx_campaigns_workspace ON public.campaigns(workspace_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_project ON public.campaigns(project_id);
CREATE INDEX idx_media_plan_items_campaign ON public.media_plan_items(campaign_id);
CREATE INDEX idx_media_plan_items_publish_date ON public.media_plan_items(publish_date);
CREATE INDEX idx_campaign_deliverables_campaign ON public.campaign_deliverables(campaign_id);