-- Update the notify_on_mention function to include tab=comments in action_url
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id uuid;
  actor_name text;
  entity_name text;
BEGIN
  -- Get actor name
  SELECT full_name INTO actor_name FROM profiles WHERE user_id = NEW.created_by;
  
  -- Get entity name based on entity_type
  IF NEW.entity_type = 'task' THEN
    SELECT title INTO entity_name FROM tasks WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'project' THEN
    SELECT name INTO entity_name FROM projects WHERE id = NEW.entity_id;
  END IF;
  
  -- Notify each mentioned user
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      -- Don't notify the author of their own mentions
      IF mentioned_user_id != NEW.created_by THEN
        INSERT INTO notifications (
          workspace_id, 
          user_id, 
          type, 
          title, 
          message, 
          action_url,
          actor_id,
          related_entity_type,
          related_entity_id,
          related_entity_name
        )
        VALUES (
          NEW.workspace_id,
          mentioned_user_id,
          'mention',
          COALESCE(actor_name, 'Quelqu''un') || ' vous a mentionné',
          NEW.content,
          CASE 
            WHEN NEW.entity_type = 'task' THEN '/tasks/' || NEW.entity_id::text || '?tab=comments'
            WHEN NEW.entity_type = 'project' THEN '/projects/' || NEW.entity_id::text || '?tab=comments'
            ELSE NULL
          END,
          NEW.created_by,
          NEW.entity_type,
          NEW.entity_id,
          entity_name
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing notifications to have ?tab=comments
UPDATE notifications 
SET action_url = action_url || '?tab=comments'
WHERE action_url LIKE '/tasks/%' 
  AND action_url NOT LIKE '%?%'
  AND type = 'mention';