-- Create enum for purchase types
CREATE TYPE purchase_type AS ENUM ('provision', 'supplier_invoice');

-- Create enum for purchase categories
CREATE TYPE purchase_category AS ENUM (
  'subcontract', 
  'printing', 
  'rental', 
  'transport', 
  'material', 
  'service', 
  'other'
);

-- Create enum for purchase status
CREATE TYPE purchase_status AS ENUM (
  'draft',
  'pending_validation',
  'validated',
  'invoice_received',
  'payment_pending',
  'paid',
  'cancelled'
);

-- Create project_purchases table
CREATE TABLE public.project_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Type & Category
  purchase_type purchase_type NOT NULL DEFAULT 'provision',
  purchase_category purchase_category NOT NULL DEFAULT 'other',
  
  -- Basic info
  title text NOT NULL,
  description text,
  
  -- Supplier info
  supplier_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  supplier_name text,
  
  -- Invoice info
  invoice_number text,
  invoice_date date,
  due_date date,
  received_date date,
  
  -- Amounts
  amount_ht numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) DEFAULT 20,
  amount_ttc numeric(12,2) GENERATED ALWAYS AS (amount_ht * (1 + COALESCE(vat_rate, 0) / 100)) STORED,
  
  -- Selling price & margin (optional)
  selling_price numeric(12,2),
  margin_percentage numeric(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN selling_price > 0 AND amount_ht > 0 
      THEN ((selling_price - amount_ht) / selling_price) * 100 
      ELSE NULL 
    END
  ) STORED,
  
  -- Status & tracking
  status purchase_status NOT NULL DEFAULT 'draft',
  payment_date date,
  payment_reference text,
  
  -- Assignment
  assigned_to uuid,
  
  -- Files
  file_url text,
  files jsonb DEFAULT '[]'::jsonb,
  
  -- Notes
  notes text,
  
  -- Phase link (optional)
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  
  -- Sorting
  sort_order integer DEFAULT 0,
  
  -- Audit
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view purchases in their workspace"
ON public.project_purchases
FOR SELECT
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create purchases in their workspace"
ON public.project_purchases
FOR INSERT
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update purchases in their workspace"
ON public.project_purchases
FOR UPDATE
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can delete purchases in their workspace"
ON public.project_purchases
FOR DELETE
USING (is_workspace_member(workspace_id, auth.uid()));

-- Create index for performance
CREATE INDEX idx_project_purchases_project ON public.project_purchases(project_id);
CREATE INDEX idx_project_purchases_workspace ON public.project_purchases(workspace_id);
CREATE INDEX idx_project_purchases_status ON public.project_purchases(status);
CREATE INDEX idx_project_purchases_type ON public.project_purchases(purchase_type);

-- Create updated_at trigger
CREATE TRIGGER update_project_purchases_updated_at
  BEFORE UPDATE ON public.project_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for purchases
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_purchases;