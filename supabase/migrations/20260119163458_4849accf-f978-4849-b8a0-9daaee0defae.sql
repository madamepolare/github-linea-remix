-- Add retention guarantee fields to commercial_documents
ALTER TABLE commercial_documents
ADD COLUMN IF NOT EXISTS retention_guarantee_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS retention_guarantee_amount NUMERIC GENERATED ALWAYS AS (total_amount * retention_guarantee_percentage / 100) STORED;

-- Add comment for documentation
COMMENT ON COLUMN commercial_documents.retention_guarantee_percentage IS 'Pourcentage de retenue de garantie (5% typique), déduit du solde final';
COMMENT ON COLUMN commercial_documents.retention_guarantee_amount IS 'Montant calculé de la retenue de garantie';