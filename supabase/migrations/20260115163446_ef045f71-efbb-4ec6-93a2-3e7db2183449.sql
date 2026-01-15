-- Fix search_path security warning for the function
CREATE OR REPLACE FUNCTION public.handle_inbound_email_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_id UUID;
  v_original_sender_id UUID;
BEGIN
  -- Only process inbound emails
  IF NEW.direction != 'inbound' THEN
    RETURN NEW;
  END IF;

  -- Find if there's a previous outbound email in the same thread
  SELECT created_by INTO v_original_sender_id
  FROM public.crm_emails
  WHERE gmail_thread_id = NEW.gmail_thread_id
    AND direction = 'outbound'
    AND workspace_id = NEW.workspace_id
  ORDER BY sent_at DESC
  LIMIT 1;

  -- If this is a reply to an outbound email
  IF v_original_sender_id IS NOT NULL THEN
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
      -- Increment unread replies count and update tracking
      UPDATE public.contact_pipeline_entries
      SET 
        unread_replies_count = COALESCE(unread_replies_count, 0) + 1,
        awaiting_response = false,
        last_inbound_email_at = NOW(),
        updated_at = NOW()
      WHERE id = v_entry_id;

      -- Create a notification for the original sender
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;