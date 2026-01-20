-- Backfill existing crm_emails: auto-resolve contact_id/company_id from to_email or from_email
-- For outbound emails without contact_id, try to match to_email to a contact
UPDATE crm_emails e
SET 
  contact_id = c.id,
  company_id = COALESCE(e.company_id, c.crm_company_id)
FROM contacts c
WHERE e.contact_id IS NULL
  AND e.direction = 'outbound'
  AND e.to_email IS NOT NULL
  AND c.workspace_id = e.workspace_id
  AND LOWER(c.email) = LOWER(e.to_email);

-- For inbound emails without contact_id, try to match from_email to a contact
UPDATE crm_emails e
SET 
  contact_id = c.id,
  company_id = COALESCE(e.company_id, c.crm_company_id)
FROM contacts c
WHERE e.contact_id IS NULL
  AND e.direction = 'inbound'
  AND e.from_email IS NOT NULL
  AND c.workspace_id = e.workspace_id
  AND LOWER(c.email) = LOWER(e.from_email);

-- For outbound emails without company_id, try to match to_email to a company
UPDATE crm_emails e
SET company_id = co.id
FROM crm_companies co
WHERE e.company_id IS NULL
  AND e.direction = 'outbound'
  AND e.to_email IS NOT NULL
  AND co.workspace_id = e.workspace_id
  AND LOWER(co.email) = LOWER(e.to_email);

-- For inbound emails without company_id, try to match from_email to a company
UPDATE crm_emails e
SET company_id = co.id
FROM crm_companies co
WHERE e.company_id IS NULL
  AND e.direction = 'inbound'
  AND e.from_email IS NOT NULL
  AND co.workspace_id = e.workspace_id
  AND LOWER(co.email) = LOWER(e.from_email);

-- Create trigger function to auto-associate emails with contacts/companies on insert
CREATE OR REPLACE FUNCTION public.auto_associate_crm_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_company_id uuid;
  v_target_email text;
BEGIN
  -- Skip if already has contact_id
  IF NEW.contact_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine target email based on direction
  IF NEW.direction = 'outbound' THEN
    v_target_email := NEW.to_email;
  ELSE
    v_target_email := NEW.from_email;
  END IF;

  -- Try to match to a contact
  IF v_target_email IS NOT NULL THEN
    SELECT id, crm_company_id INTO v_contact_id, v_company_id
    FROM contacts
    WHERE workspace_id = NEW.workspace_id
      AND LOWER(email) = LOWER(v_target_email)
    LIMIT 1;

    IF v_contact_id IS NOT NULL THEN
      NEW.contact_id := v_contact_id;
      IF NEW.company_id IS NULL AND v_company_id IS NOT NULL THEN
        NEW.company_id := v_company_id;
      END IF;
    END IF;
  END IF;

  -- If still no company, try to match company email
  IF NEW.company_id IS NULL AND v_target_email IS NOT NULL THEN
    SELECT id INTO v_company_id
    FROM crm_companies
    WHERE workspace_id = NEW.workspace_id
      AND LOWER(email) = LOWER(v_target_email)
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
      NEW.company_id := v_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS auto_associate_email_trigger ON crm_emails;
CREATE TRIGGER auto_associate_email_trigger
  BEFORE INSERT ON crm_emails
  FOR EACH ROW
  EXECUTE FUNCTION auto_associate_crm_email();