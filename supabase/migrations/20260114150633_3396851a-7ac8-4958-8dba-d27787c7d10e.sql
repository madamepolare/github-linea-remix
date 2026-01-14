-- Ajouter les colonnes pour marché public et avenant
ALTER TABLE commercial_documents
ADD COLUMN IF NOT EXISTS is_public_market BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS market_reference TEXT,
ADD COLUMN IF NOT EXISTS is_amendment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 30;

-- Ajouter référence client dans crm_companies
ALTER TABLE crm_companies
ADD COLUMN IF NOT EXISTS client_reference TEXT;

-- Table pour les liens publics de devis
CREATE TABLE IF NOT EXISTS quote_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES commercial_documents(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_email TEXT,
  signer_ip TEXT,
  signature_data TEXT,
  signed_pdf_url TEXT,
  options_selected JSONB,
  final_amount NUMERIC,
  deposit_paid BOOLEAN DEFAULT false,
  deposit_paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE quote_public_links ENABLE ROW LEVEL SECURITY;

-- Policies for quote_public_links
CREATE POLICY "Users can view their workspace quote links"
ON quote_public_links FOR SELECT
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create quote links in their workspace"
ON quote_public_links FOR INSERT
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their workspace quote links"
ON quote_public_links FOR UPDATE
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their workspace quote links"
ON quote_public_links FOR DELETE
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));