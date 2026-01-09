-- Add first_name, last_name and gender columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));

-- Create index on gender for filtering
CREATE INDEX idx_contacts_gender ON public.contacts(gender);

-- Update existing contacts: try to split name into first_name and last_name
UPDATE public.contacts
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL;