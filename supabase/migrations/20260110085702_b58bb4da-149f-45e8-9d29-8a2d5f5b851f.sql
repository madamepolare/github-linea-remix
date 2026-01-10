-- =============================================
-- COMMERCIAL MODULE RESTRUCTURING
-- Flexible quote system with contract types and enriched quote lines
-- =============================================

-- 1. Create contract_types table for customizable contract typologies
CREATE TABLE public.contract_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'FileText',
  color TEXT DEFAULT '#3B82F6',
  -- Dynamic fields to show based on contract type
  default_fields JSONB DEFAULT '{"surface": false, "construction_budget": false, "address": false}'::jsonb,
  default_clauses JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create quote_line_templates table for reusable line item templates
CREATE TABLE public.quote_line_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contract_type_id UUID REFERENCES public.contract_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'service', -- service, option, expense, discount
  default_unit TEXT DEFAULT 'forfait',
  default_unit_price NUMERIC,
  default_quantity NUMERIC DEFAULT 1,
  billing_type TEXT DEFAULT 'one_time', -- one_time, recurring_monthly, hourly, daily
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add new columns to commercial_document_phases for enriched quote lines
-- These columns transform phases into full-featured quote lines
ALTER TABLE public.commercial_document_phases
  ADD COLUMN IF NOT EXISTS line_type TEXT DEFAULT 'phase',
  ADD COLUMN IF NOT EXISTS assigned_member_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_skill TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
  ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS recurrence_months INTEGER,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'forfait',
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC;

-- 4. Add contract_type_id to commercial_documents
ALTER TABLE public.commercial_documents
  ADD COLUMN IF NOT EXISTS contract_type_id UUID REFERENCES public.contract_types(id) ON DELETE SET NULL;

-- 5. Add contract_type_id to pricing_grids
ALTER TABLE public.pricing_grids
  ADD COLUMN IF NOT EXISTS contract_type_id UUID REFERENCES public.contract_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'one_time';

-- 6. Enable Row Level Security
ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_templates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for contract_types
CREATE POLICY "Users can view contract types in their workspace"
  ON public.contract_types FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contract types in their workspace"
  ON public.contract_types FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contract types in their workspace"
  ON public.contract_types FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contract types in their workspace"
  ON public.contract_types FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- 8. Create RLS policies for quote_line_templates
CREATE POLICY "Users can view quote line templates in their workspace"
  ON public.quote_line_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quote line templates in their workspace"
  ON public.quote_line_templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quote line templates in their workspace"
  ON public.quote_line_templates FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quote line templates in their workspace"
  ON public.quote_line_templates FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- 9. Create updated_at trigger for contract_types
CREATE TRIGGER update_contract_types_updated_at
  BEFORE UPDATE ON public.contract_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();