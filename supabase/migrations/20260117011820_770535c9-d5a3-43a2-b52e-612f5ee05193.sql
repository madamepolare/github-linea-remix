-- Update the document number format to D{YY0001}
-- D = document type letter (D for Devis, C for Contrat, P for Proposition)
-- YY = 2-digit year
-- 0001 = sequential number

CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type text, ws_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix TEXT;
  year_str TEXT;
  next_num INTEGER;
  result TEXT;
BEGIN
  -- Single letter prefix
  prefix := CASE doc_type
    WHEN 'quote' THEN 'D'
    WHEN 'contract' THEN 'C'
    WHEN 'proposal' THEN 'P'
    ELSE 'X'
  END;
  
  -- 2-digit year
  year_str := TO_CHAR(NOW(), 'YY');
  
  -- Find next sequence number for this workspace, type and year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM commercial_documents
  WHERE workspace_id = ws_id
    AND document_type = doc_type
    AND document_number ~ ('^' || prefix || year_str || '[0-9]+$');
  
  -- Format: D250001
  result := prefix || year_str || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$function$;