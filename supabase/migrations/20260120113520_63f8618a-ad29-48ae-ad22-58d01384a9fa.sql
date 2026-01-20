-- Ensure inbound email replies update pipeline entries + create notifications
-- This recreates a robust trigger that ties inbound emails to the last outbound email in the same Gmail thread.

CREATE OR REPLACE FUNCTION public.handle_inbound_email_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbound_company_id uuid;
  v_outbound_contact_id uuid;
  v_original_sender_id uuid;
  v_entry_id uuid;
BEGIN
  -- Only handle inbound emails
  IF NEW.direction IS DISTINCT FROM 'inbound' THEN
    RETURN NEW;
  END IF;

  -- We need a Gmail thread id to correlate
  IF NEW.gmail_thread_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the most recent outbound email in the same thread (this carries pipeline context)
  SELECT e.company_id, e.contact_id, e.created_by
    INTO v_outbound_company_id, v_outbound_contact_id, v_original_sender_id
  FROM public.crm_emails e
  WHERE e.workspace_id = NEW.workspace_id
    AND e.gmail_thread_id = NEW.gmail_thread_id
    AND e.direction = 'outbound'
  ORDER BY COALESCE(e.sent_at, e.created_at) DESC
  LIMIT 1;

  -- If we can't correlate to an outbound, we can't attribute to a pipeline entry reliably
  IF v_outbound_company_id IS NULL AND v_outbound_contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find a pipeline entry matching the outbound context
  SELECT id INTO v_entry_id
  FROM public.contact_pipeline_entries
  WHERE workspace_id = NEW.workspace_id
    AND (
      (v_outbound_contact_id IS NOT NULL AND contact_id = v_outbound_contact_id)
      OR (v_outbound_company_id IS NOT NULL AND company_id = v_outbound_company_id)
    )
  ORDER BY COALESCE(updated_at, created_at) DESC
  LIMIT 1;

  IF v_entry_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update pipeline entry state
  UPDATE public.contact_pipeline_entries
  SET
    last_inbound_email_at = COALESCE(NEW.received_at, NEW.created_at, now()),
    awaiting_response = false,
    unread_replies_count = COALESCE(unread_replies_count, 0) + 1,
    updated_at = now()
  WHERE id = v_entry_id;

  -- Create a notification for the original sender (if we know them)
  IF v_original_sender_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      workspace_id,
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      is_read
    ) VALUES (
      NEW.workspace_id,
      v_original_sender_id,
      'email_reply',
      'Nouvelle réponse reçue',
      COALESCE(NEW.subject, 'Un contact a répondu à votre email'),
      'pipeline_entry',
      v_entry_id,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_handle_inbound_email_reply ON public.crm_emails;
CREATE TRIGGER trg_handle_inbound_email_reply
AFTER INSERT ON public.crm_emails
FOR EACH ROW
WHEN (NEW.direction = 'inbound' AND NEW.gmail_thread_id IS NOT NULL)
EXECUTE FUNCTION public.handle_inbound_email_reply();