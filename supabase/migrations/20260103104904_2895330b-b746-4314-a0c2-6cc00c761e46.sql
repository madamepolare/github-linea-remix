-- Create quote templates table for reusable quote templates
CREATE TABLE public.quote_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'interior',
  phases JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing grids table for reusable pricing
CREATE TABLE public.pricing_grids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  grid_type TEXT NOT NULL DEFAULT 'hourly', -- hourly, daily, m2, fixed
  items JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_grids ENABLE ROW LEVEL SECURITY;

-- RLS policies for quote_templates
CREATE POLICY "Users can view quote_templates in their workspace" 
ON public.quote_templates 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create quote_templates in their workspace" 
ON public.quote_templates 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update quote_templates in their workspace" 
ON public.quote_templates 
FOR UPDATE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete quote_templates in their workspace" 
ON public.quote_templates 
FOR DELETE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- RLS policies for pricing_grids
CREATE POLICY "Users can view pricing_grids in their workspace" 
ON public.pricing_grids 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create pricing_grids in their workspace" 
ON public.pricing_grids 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pricing_grids in their workspace" 
ON public.pricing_grids 
FOR UPDATE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pricing_grids in their workspace" 
ON public.pricing_grids 
FOR DELETE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Add indexes
CREATE INDEX idx_quote_templates_workspace ON public.quote_templates(workspace_id);
CREATE INDEX idx_pricing_grids_workspace ON public.pricing_grids(workspace_id);