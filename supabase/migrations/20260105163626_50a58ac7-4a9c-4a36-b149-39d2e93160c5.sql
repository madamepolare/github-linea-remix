-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL DEFAULT 'standard', -- standard, credit_note, proforma, deposit
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, sent, paid, overdue, cancelled
  
  -- Client info (linked to CRM)
  client_company_id UUID REFERENCES public.crm_companies(id),
  client_contact_id UUID REFERENCES public.contacts(id),
  client_name TEXT,
  client_address TEXT,
  client_city TEXT,
  client_postal_code TEXT,
  client_country TEXT DEFAULT 'France',
  client_siret TEXT,
  client_vat_number TEXT,
  
  -- Project reference
  project_id UUID REFERENCES public.projects(id),
  project_name TEXT,
  project_reference TEXT,
  
  -- Commercial document reference (for invoicing from quotes/contracts)
  commercial_document_id UUID REFERENCES public.commercial_documents(id),
  
  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Amounts
  subtotal_ht DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tva_rate DECIMAL(5, 2) DEFAULT 20,
  tva_amount DECIMAL(12, 2) DEFAULT 0,
  total_ttc DECIMAL(12, 2) DEFAULT 0,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  amount_due DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Payment info
  payment_terms TEXT DEFAULT 'Paiement à 30 jours à compter de la date de facturation.',
  payment_method TEXT, -- virement, cheque, carte, prelevement
  bank_name TEXT,
  bank_iban TEXT,
  bank_bic TEXT,
  
  -- Chorus Pro integration
  chorus_pro_enabled BOOLEAN DEFAULT FALSE,
  chorus_pro_service_code TEXT,
  chorus_pro_engagement_number TEXT,
  chorus_pro_submission_date TIMESTAMPTZ,
  chorus_pro_status TEXT, -- pending, submitted, accepted, rejected
  chorus_pro_response JSONB,
  
  -- Document content
  header_text TEXT,
  footer_text TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- PDF
  pdf_url TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice line items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Item details
  item_type TEXT DEFAULT 'service', -- service, product, phase, expense, discount
  code TEXT,
  description TEXT NOT NULL,
  detailed_description TEXT,
  
  -- Quantities and pricing
  quantity DECIMAL(10, 3) DEFAULT 1,
  unit TEXT DEFAULT 'unité', -- unité, heure, jour, forfait, m², etc.
  unit_price DECIMAL(12, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tva_rate DECIMAL(5, 2) DEFAULT 20,
  amount_ht DECIMAL(12, 2) NOT NULL,
  amount_tva DECIMAL(12, 2) DEFAULT 0,
  amount_ttc DECIMAL(12, 2) NOT NULL,
  
  -- References
  phase_id UUID, -- Reference to a project phase if applicable
  phase_name TEXT,
  percentage_completed DECIMAL(5, 2) DEFAULT 100, -- For partial invoicing
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice payments tracking
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT, -- virement, cheque, carte, especes, prelevement
  reference TEXT, -- check number, transaction ID, etc.
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice reminders
CREATE TABLE public.invoice_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL, -- reminder_1, reminder_2, formal_notice
  scheduled_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  
  subject TEXT,
  body TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_invoices_workspace ON public.invoices(workspace_id);
CREATE INDEX idx_invoices_client ON public.invoices(client_company_id);
CREATE INDEX idx_invoices_project ON public.invoices(project_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their workspace"
  ON public.invoices FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create invoices in their workspace"
  ON public.invoices FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update invoices in their workspace"
  ON public.invoices FOR UPDATE
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can delete invoices in their workspace"
  ON public.invoices FOR DELETE
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items via invoice"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_id AND is_workspace_member(i.workspace_id, auth.uid())
  ));

CREATE POLICY "Users can manage invoice items via invoice"
  ON public.invoice_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_id AND is_workspace_member(i.workspace_id, auth.uid())
  ));

-- RLS Policies for invoice_payments
CREATE POLICY "Users can view payments in their workspace"
  ON public.invoice_payments FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage payments in their workspace"
  ON public.invoice_payments FOR ALL
  USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for invoice_reminders
CREATE POLICY "Users can view reminders in their workspace"
  ON public.invoice_reminders FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can manage reminders in their workspace"
  ON public.invoice_reminders FOR ALL
  USING (is_workspace_member(workspace_id, auth.uid()));

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(inv_type TEXT, ws_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  next_num INTEGER;
  result TEXT;
BEGIN
  prefix := CASE inv_type
    WHEN 'standard' THEN 'FAC'
    WHEN 'credit_note' THEN 'AVO'
    WHEN 'proforma' THEN 'PRO'
    WHEN 'deposit' THEN 'ACO'
    ELSE 'FAC'
  END;
  
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE workspace_id = ws_id
    AND invoice_type = inv_type
    AND invoice_number LIKE prefix || '-' || year_str || '-%';
  
  result := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- Trigger for auto-generating invoice number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.invoice_type, NEW.workspace_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_number();

-- Trigger for updating updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();