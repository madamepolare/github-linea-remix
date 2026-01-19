-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Message notifications
  notify_mentions BOOLEAN DEFAULT true,
  notify_new_messages BOOLEAN DEFAULT true,
  notify_comment_replies BOOLEAN DEFAULT true,
  notify_reactions BOOLEAN DEFAULT false,
  
  -- Task notifications
  notify_task_created BOOLEAN DEFAULT true,
  notify_task_assigned BOOLEAN DEFAULT true,
  notify_task_completed BOOLEAN DEFAULT false,
  
  -- Project notifications
  notify_project_updates BOOLEAN DEFAULT true,
  
  -- Other
  notify_invites BOOLEAN DEFAULT true,
  
  -- Delivery channels
  email_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  
  -- Do not disturb
  do_not_disturb BOOLEAN DEFAULT false,
  dnd_start TIME DEFAULT '22:00:00',
  dnd_end TIME DEFAULT '08:00:00',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the notify_on_team_message function to notify all channel members
CREATE OR REPLACE FUNCTION public.notify_on_team_message()
RETURNS TRIGGER AS $$
DECLARE
  member_record RECORD;
  channel_name TEXT;
  author_name TEXT;
  mentioned_user_id UUID;
  user_prefs RECORD;
  should_notify BOOLEAN;
BEGIN
  -- Get channel info
  SELECT name INTO channel_name FROM public.team_channels WHERE id = NEW.channel_id;
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
      INSERT INTO public.notifications (workspace_id, user_id, type, title, message, actor_id, action_url, related_entity_type, related_entity_id)
      VALUES (
        NEW.workspace_id,
        member_record.user_id,
        'new_message',
        'Nouveau message dans ' || COALESCE(channel_name, 'une conversation'),
        LEFT(NEW.content, 200),
        NEW.created_by,
        '/messages/' || NEW.channel_id,
        'message',
        NEW.id
      );
    END IF;
  END LOOP;
  
  -- 2) Notify mentioned users (priority - mention notification)
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      IF mentioned_user_id != NEW.created_by THEN
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
          INSERT INTO public.notifications (workspace_id, user_id, type, title, message, actor_id, action_url, related_entity_type, related_entity_id)
          VALUES (
            NEW.workspace_id,
            mentioned_user_id,
            'mention',
            COALESCE(author_name, 'Quelqu''un') || ' vous a mentionné',
            LEFT(NEW.content, 200),
            NEW.created_by,
            '/messages/' || NEW.channel_id,
            'message',
            NEW.id
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;