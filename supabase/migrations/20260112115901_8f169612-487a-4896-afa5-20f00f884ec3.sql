-- Function to create notifications for communication replies
CREATE OR REPLACE FUNCTION public.notify_on_communication_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_author_id uuid;
  parent_content text;
  comm_workspace_id uuid;
BEGIN
  -- Only trigger on replies (when parent_id is set)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent communication author
    SELECT created_by, LEFT(content, 50), workspace_id INTO parent_author_id, parent_content, comm_workspace_id
    FROM public.communications
    WHERE id = NEW.parent_id;
    
    -- Don't notify if replying to own message
    IF parent_author_id IS NOT NULL AND parent_author_id != NEW.created_by THEN
      INSERT INTO public.notifications (workspace_id, user_id, type, title, message, action_url)
      VALUES (
        comm_workspace_id,
        parent_author_id,
        'comment_reply',
        'Nouvelle réponse à votre message',
        LEFT(NEW.content, 100),
        '/' || NEW.entity_type || 's/' || NEW.entity_id::text
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify on reactions to communications
CREATE OR REPLACE FUNCTION public.notify_on_communication_reaction()
RETURNS TRIGGER AS $$
DECLARE
  comm_author_id uuid;
  comm_workspace_id uuid;
  comm_entity_type text;
  comm_entity_id uuid;
BEGIN
  -- Get the communication author and details
  SELECT created_by, workspace_id, entity_type, entity_id INTO comm_author_id, comm_workspace_id, comm_entity_type, comm_entity_id
  FROM public.communications
  WHERE id = NEW.communication_id;
  
  -- Don't notify if reacting to own message
  IF comm_author_id IS NOT NULL AND comm_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (workspace_id, user_id, type, title, message, action_url)
    VALUES (
      comm_workspace_id,
      comm_author_id,
      'reaction',
      'Nouvelle réaction ' || NEW.emoji || ' sur votre message',
      NULL,
      '/' || comm_entity_type || 's/' || comm_entity_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify project members on new task
CREATE OR REPLACE FUNCTION public.notify_on_task_created()
RETURNS TRIGGER AS $$
DECLARE
  member_record RECORD;
  project_name text;
BEGIN
  -- Only if task is linked to a project
  IF NEW.project_id IS NOT NULL THEN
    -- Get project name
    SELECT name INTO project_name FROM public.projects WHERE id = NEW.project_id;
    
    -- Notify all project members except the creator
    FOR member_record IN 
      SELECT user_id FROM public.project_members 
      WHERE project_id = NEW.project_id AND user_id != NEW.created_by
    LOOP
      INSERT INTO public.notifications (workspace_id, user_id, type, title, message, action_url)
      VALUES (
        NEW.workspace_id,
        member_record.user_id,
        'task_created',
        'Nouvelle tâche sur ' || COALESCE(project_name, 'un projet'),
        NEW.title,
        '/projects/' || NEW.project_id::text || '?tab=tasks'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify project members on project status change
CREATE OR REPLACE FUNCTION public.notify_on_project_update()
RETURNS TRIGGER AS $$
DECLARE
  member_record RECORD;
BEGIN
  -- Only notify on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify all project members except the one who made the change
    FOR member_record IN 
      SELECT user_id FROM public.project_members 
      WHERE project_id = NEW.id
    LOOP
      INSERT INTO public.notifications (workspace_id, user_id, type, title, message, action_url)
      VALUES (
        NEW.workspace_id,
        member_record.user_id,
        'project_update',
        'Statut du projet "' || NEW.name || '" modifié',
        'Nouveau statut : ' || NEW.status,
        '/projects/' || NEW.id::text
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify mentioned users in communications
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id uuid;
BEGIN
  -- Check if there are mentions
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      -- Don't notify if mentioning yourself
      IF mentioned_user_id != NEW.created_by THEN
        INSERT INTO public.notifications (workspace_id, user_id, type, title, message, action_url)
        VALUES (
          NEW.workspace_id,
          mentioned_user_id,
          'mention',
          'Vous avez été mentionné',
          LEFT(NEW.content, 100),
          '/' || NEW.entity_type || 's/' || NEW.entity_id::text
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_communication_reply ON public.communications;
CREATE TRIGGER trigger_notify_communication_reply
  AFTER INSERT ON public.communications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_communication_reply();

DROP TRIGGER IF EXISTS trigger_notify_communication_reaction ON public.communication_reactions;
CREATE TRIGGER trigger_notify_communication_reaction
  AFTER INSERT ON public.communication_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_communication_reaction();

DROP TRIGGER IF EXISTS trigger_notify_task_created ON public.tasks;
CREATE TRIGGER trigger_notify_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_task_created();

DROP TRIGGER IF EXISTS trigger_notify_project_update ON public.projects;
CREATE TRIGGER trigger_notify_project_update
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_project_update();

DROP TRIGGER IF EXISTS trigger_notify_mention ON public.communications;
CREATE TRIGGER trigger_notify_mention
  AFTER INSERT ON public.communications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mention();