-- Add new fields to commercial_documents for enhanced quote builder
ALTER TABLE commercial_documents
ADD COLUMN IF NOT EXISTS reference_client TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS expected_start_date DATE,
ADD COLUMN IF NOT EXISTS expected_end_date DATE,
ADD COLUMN IF NOT EXISTS expected_signature_date DATE,
ADD COLUMN IF NOT EXISTS internal_owner_id UUID,
ADD COLUMN IF NOT EXISTS invoice_schedule JSONB DEFAULT '[]';

-- Add billing_contact_id if not exists (separate from client_contact_id)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commercial_documents' AND column_name = 'billing_contact_id') THEN
    ALTER TABLE commercial_documents ADD COLUMN billing_contact_id UUID REFERENCES contacts(id);
  END IF;
END $$;

-- Add commercial_document_id to projects for traceability
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS commercial_document_id UUID REFERENCES commercial_documents(id),
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Create table for commercial document invoice schedule (more flexible than JSONB)
CREATE TABLE IF NOT EXISTS commercial_document_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES commercial_documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  schedule_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  percentage NUMERIC,
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  amount_ttc NUMERIC,
  vat_rate NUMERIC DEFAULT 20,
  planned_date DATE,
  milestone TEXT,
  phase_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE commercial_document_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commercial_document_schedule
CREATE POLICY "Users can view schedule items in their workspace"
ON commercial_document_schedule FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert schedule items in their workspace"
ON commercial_document_schedule FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update schedule items in their workspace"
ON commercial_document_schedule FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete schedule items in their workspace"
ON commercial_document_schedule FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_commercial_document_schedule_document_id 
ON commercial_document_schedule(document_id);

CREATE INDEX IF NOT EXISTS idx_commercial_document_schedule_workspace_id 
ON commercial_document_schedule(workspace_id);