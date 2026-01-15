-- Create or replace function to handle outbound emails (reset unread count)
CREATE OR REPLACE FUNCTION public.handle_outbound_email_sent()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Only process outbound emails
  IF NEW.direction != 'outbound' THEN
    RETURN NEW;
  END IF;

  -- Find the pipeline entry for this contact/company
  SELECT id INTO v_entry_id
  FROM public.contact_pipeline_entries
  WHERE workspace_id = NEW.workspace_id
    AND (
      (NEW.contact_id IS NOT NULL AND contact_id = NEW.contact_id) OR
      (NEW.company_id IS NOT NULL AND company_id = NEW.company_id)
    )
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_entry_id IS NOT NULL THEN
    -- Reset unread replies count and set awaiting response
    UPDATE public.contact_pipeline_entries
    SET 
      unread_replies_count = 0,
      awaiting_response = true,
      last_email_sent_at = NOW(),
      updated_at = NOW()
    WHERE id = v_entry_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for outbound emails
DROP TRIGGER IF EXISTS on_outbound_email_sent ON public.crm_emails;
CREATE TRIGGER on_outbound_email_sent
  AFTER INSERT ON public.crm_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_outbound_email_sent();

-- Also create trigger for inbound if it doesn't exist
DROP TRIGGER IF EXISTS on_inbound_email_reply ON public.crm_emails;
CREATE TRIGGER on_inbound_email_reply
  AFTER INSERT ON public.crm_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_inbound_email_reply();