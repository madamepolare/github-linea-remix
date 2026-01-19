-- Fonction trigger pour créer des notifications sur les nouveaux messages team
-- Notifie les utilisateurs mentionnés
CREATE OR REPLACE FUNCTION public.notify_on_team_message()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id UUID;
  channel_name TEXT;
  author_name TEXT;
BEGIN
  -- Get channel name
  SELECT name INTO channel_name FROM team_channels WHERE id = NEW.channel_id;
  
  -- Get author name
  SELECT full_name INTO author_name FROM profiles WHERE user_id = NEW.created_by;
  
  -- Create notification for each mentioned user (excluding the author)
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      IF mentioned_user_id != NEW.created_by THEN
        INSERT INTO notifications (
          workspace_id,
          user_id,
          type,
          title,
          message,
          actor_id,
          action_url,
          related_entity_type,
          related_entity_id
        ) VALUES (
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
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_team_message_insert ON team_messages;

-- Create trigger
CREATE TRIGGER on_team_message_insert
  AFTER INSERT ON team_messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_team_message();