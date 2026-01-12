-- Add actor and context columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS related_entity_type text,
ADD COLUMN IF NOT EXISTS related_entity_id uuid,
ADD COLUMN IF NOT EXISTS related_entity_name text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON public.notifications(related_entity_type, related_entity_id);

-- Update the existing notify_mention trigger function to include actor and context
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
            WHEN NEW.entity_type = 'task' THEN '/tasks/' || NEW.entity_id::text
            WHEN NEW.entity_type = 'project' THEN '/projects/' || NEW.entity_id::text
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
$$;