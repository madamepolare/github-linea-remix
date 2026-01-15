-- Add status column to contacts table
ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'confirmed' CHECK (status IN ('lead', 'confirmed'));

-- Add status column to crm_companies table  
ALTER TABLE crm_companies ADD COLUMN status TEXT DEFAULT 'confirmed' CHECK (status IN ('lead', 'confirmed'));

-- Create indexes for performance
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_crm_companies_status ON crm_companies(status);