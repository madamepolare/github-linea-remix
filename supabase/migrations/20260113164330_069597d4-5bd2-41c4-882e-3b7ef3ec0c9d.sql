-- Add department role to contacts (role within that specific department)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS department_role TEXT;

-- Add billing contact to companies (default billing contact)
ALTER TABLE public.crm_companies ADD COLUMN IF NOT EXISTS billing_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Add billing contact to departments (overrides company default)
ALTER TABLE public.company_departments ADD COLUMN IF NOT EXISTS billing_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Create billing_profiles table for fiscal information
CREATE TABLE IF NOT EXISTS public.billing_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  
  -- Identification fiscale
  siret TEXT,
  siren TEXT,
  vat_number TEXT, -- Numéro TVA intracommunautaire
  code_naf TEXT,
  
  -- Forme juridique
  legal_form TEXT, -- SARL, SAS, SA, EI, etc.
  capital_social NUMERIC,
  rcs_city TEXT, -- Ville du RCS
  
  -- Adresse de facturation (si différente)
  billing_address TEXT,
  billing_postal_code TEXT,
  billing_city TEXT,
  billing_country TEXT,
  
  -- Contact facturation
  billing_email TEXT,
  billing_phone TEXT,
  billing_name TEXT, -- Nom du contact facturation
  
  -- Coordonnées bancaires
  iban TEXT,
  bic TEXT,
  bank_name TEXT,
  
  -- Conditions de paiement
  payment_terms TEXT, -- 30 jours, 45 jours fin de mois, etc.
  payment_method TEXT, -- Virement, chèque, prélèvement, etc.
  
  -- TVA
  vat_type TEXT, -- 'normal', 'exonere', 'autoliquidation', 'franchise'
  vat_rate NUMERIC DEFAULT 20,
  
  -- Remises
  default_discount_percent NUMERIC DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: doit avoir soit contact_id soit company_id
  CONSTRAINT billing_profile_entity_check CHECK (
    (contact_id IS NOT NULL AND company_id IS NULL) OR
    (contact_id IS NULL AND company_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view billing profiles in their workspace"
ON public.billing_profiles FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert billing profiles in their workspace"
ON public.billing_profiles FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update billing profiles in their workspace"
ON public.billing_profiles FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete billing profiles in their workspace"
ON public.billing_profiles FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_profiles_contact ON public.billing_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_company ON public.billing_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_workspace ON public.billing_profiles(workspace_id);

-- Add trigger for updated_at
CREATE TRIGGER update_billing_profiles_updated_at
  BEFORE UPDATE ON public.billing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();