-- Fix remaining function search paths
CREATE OR REPLACE FUNCTION public.notify_on_team_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  channel_rec RECORD;
  member_rec RECORD;
  sender_name TEXT;
  sender_avatar TEXT;
BEGIN
  -- Get channel info
  SELECT * INTO channel_rec FROM public.message_channels WHERE id = NEW.channel_id;
  
  -- Get sender info
  SELECT full_name, avatar_url INTO sender_name, sender_avatar 
  FROM public.profiles WHERE user_id = NEW.sender_id;
  
  -- Create notifications for all channel members except sender
  FOR member_rec IN 
    SELECT user_id FROM public.message_channel_members 
    WHERE channel_id = NEW.channel_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (
      workspace_id,
      user_id,
      type,
      title,
      content,
      link,
      metadata
    ) VALUES (
      channel_rec.workspace_id,
      member_rec.user_id,
      'message',
      COALESCE(sender_name, 'Un membre'),
      LEFT(NEW.content, 100),
      '/messages?channel=' || NEW.channel_id::text,
      jsonb_build_object(
        'channel_id', NEW.channel_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_name', sender_name,
        'sender_avatar', sender_avatar
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;