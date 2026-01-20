-- Fix the notify_on_team_message function to show proper names for DM channels
-- Instead of showing the channel ID, show the other person's name

CREATE OR REPLACE FUNCTION public.notify_on_team_message()
RETURNS TRIGGER AS $$
DECLARE
  member_record RECORD;
  channel_record RECORD;
  channel_display_name TEXT;
  author_name TEXT;
  mentioned_user_id UUID;
  user_prefs RECORD;
  should_notify BOOLEAN;
  other_member_name TEXT;
BEGIN
  -- Get channel info (using correct table: team_channels)
  SELECT name, channel_type INTO channel_record FROM public.team_channels WHERE id = NEW.channel_id;
  
  -- Get author name (using correct column: created_by)
  SELECT full_name INTO author_name FROM public.profiles WHERE user_id = NEW.created_by;
  
  -- 1) Notify all channel members (new message) - except mentioned users and author
  FOR member_record IN 
    SELECT tcm.user_id 
    FROM public.team_channel_members tcm
    WHERE tcm.channel_id = NEW.channel_id 
    AND tcm.user_id != NEW.created_by
  LOOP
    -- Skip if user is mentioned (they'll get a mention notification instead)
    IF NEW.mentions IS NOT NULL AND member_record.user_id = ANY(NEW.mentions) THEN
      CONTINUE;
    END IF;
    
    -- Determine display name based on channel type
    IF channel_record.channel_type = 'direct' THEN
      -- For DMs, show the author's name instead of channel name
      channel_display_name := COALESCE(author_name, 'une conversation');
    ELSE
      -- For regular channels, use channel name
      channel_display_name := COALESCE(channel_record.name, 'un canal');
    END IF;
    
    -- Check user preferences
    SELECT * INTO user_prefs 
    FROM public.notification_preferences 
    WHERE user_id = member_record.user_id 
    AND workspace_id = NEW.workspace_id;
    
    -- Default to true if no preferences exist
    should_notify := true;
    
    IF user_prefs IS NOT NULL THEN
      should_notify := user_prefs.notify_new_messages;
      
      -- Check DND
      IF user_prefs.do_not_disturb AND 
         CURRENT_TIME BETWEEN user_prefs.dnd_start AND user_prefs.dnd_end THEN
        should_notify := false;
      END IF;
    END IF;
    
    IF should_notify THEN
      INSERT INTO public.notifications (workspace_id, user_id, type, title, message, actor_id, action_url, related_entity_type, related_entity_id, related_entity_name)
      VALUES (
        NEW.workspace_id,
        member_record.user_id,
        'new_message',
        'Nouveau message dans ' || channel_display_name,
        LEFT(NEW.content, 200),
        NEW.created_by,
        '/messages/' || NEW.channel_id,
        'message',
        NEW.id,
        channel_display_name
      );
    END IF;
  END LOOP;
  
  -- 2) Notify mentioned users (priority - mention notification)
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      IF mentioned_user_id != NEW.created_by THEN
        -- Determine display name for mention context
        IF channel_record.channel_type = 'direct' THEN
          channel_display_name := COALESCE(author_name, 'une conversation');
        ELSE
          channel_display_name := COALESCE(channel_record.name, 'un canal');
        END IF;
        
        -- Check user preferences for mentions
        SELECT * INTO user_prefs 
        FROM public.notification_preferences 
        WHERE user_id = mentioned_user_id 
        AND workspace_id = NEW.workspace_id;
        
        should_notify := true;
        
        IF user_prefs IS NOT NULL THEN
          should_notify := user_prefs.notify_mentions;
          
          IF user_prefs.do_not_disturb AND 
             CURRENT_TIME BETWEEN user_prefs.dnd_start AND user_prefs.dnd_end THEN
            should_notify := false;
          END IF;
        END IF;
        
        IF should_notify THEN
          INSERT INTO public.notifications (workspace_id, user_id, type, title, message, actor_id, action_url, related_entity_type, related_entity_id, related_entity_name)
          VALUES (
            NEW.workspace_id,
            mentioned_user_id,
            'mention',
            COALESCE(author_name, 'Quelqu''un') || ' vous a mentionné',
            LEFT(NEW.content, 200),
            NEW.created_by,
            '/messages/' || NEW.channel_id,
            'message',
            NEW.id,
            channel_display_name
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;