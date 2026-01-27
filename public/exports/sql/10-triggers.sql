-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 10: TRIGGERS
-- =====================================================
-- Triggers and automations
-- =====================================================

-- ==================== UPDATED_AT TRIGGERS ====================

-- Create a reusable function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply to all tables that have updated_at column
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commercial_documents_updated_at
  BEFORE UPDATE ON public.commercial_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== SYNC TRIGGERS ====================

-- Sync user role when workspace member is created
CREATE OR REPLACE FUNCTION public.sync_user_role_on_member_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, workspace_id, role)
  VALUES (NEW.user_id, NEW.workspace_id, NEW.role::app_role)
  ON CONFLICT (user_id, workspace_id) 
  DO UPDATE SET role = EXCLUDED.role, updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_user_role_on_member_insert
  AFTER INSERT ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_on_member_insert();

-- Sync profile email when auth user email changes
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- ==================== DOCUMENT NUMBER GENERATION ====================

-- Auto-generate document number on insert
CREATE TRIGGER set_document_number
  BEFORE INSERT ON public.commercial_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_document_number();

-- Auto-generate invoice number on insert
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

-- ==================== TASK TRIGGERS ====================

-- Set completed_at when task status changes to done
CREATE TRIGGER set_task_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();

-- Check deliverable completion based on task status
CREATE OR REPLACE FUNCTION public.check_deliverable_tasks_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deliverable_id uuid;
  v_main_task_id uuid;
  v_total_subtasks integer;
  v_done_subtasks integer;
  v_current_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_deliverable_id := OLD.deliverable_id;
    IF v_deliverable_id IS NULL AND OLD.parent_id IS NOT NULL THEN
      SELECT deliverable_id INTO v_deliverable_id
      FROM public.tasks WHERE id = OLD.parent_id;
    END IF;
  ELSE
    v_deliverable_id := NEW.deliverable_id;
    IF v_deliverable_id IS NULL AND NEW.parent_id IS NOT NULL THEN
      SELECT deliverable_id INTO v_deliverable_id
      FROM public.tasks WHERE id = NEW.parent_id;
    END IF;
  END IF;
  
  IF v_deliverable_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
  SELECT id INTO v_main_task_id
  FROM public.tasks
  WHERE deliverable_id = v_deliverable_id AND parent_id IS NULL
  LIMIT 1;
  
  IF v_main_task_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
  INTO v_total_subtasks, v_done_subtasks
  FROM public.tasks WHERE parent_id = v_main_task_id;
  
  SELECT status INTO v_current_status
  FROM public.project_deliverables WHERE id = v_deliverable_id;
  
  IF v_total_subtasks > 0 AND v_done_subtasks = v_total_subtasks THEN
    IF v_current_status NOT IN ('delivered', 'validated', 'ready_to_send') THEN
      UPDATE public.project_deliverables
      SET status = 'ready_to_send', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  ELSIF v_total_subtasks > 0 AND v_done_subtasks > 0 THEN
    IF v_current_status = 'pending' THEN
      UPDATE public.project_deliverables
      SET status = 'in_progress', updated_at = now()
      WHERE id = v_deliverable_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE TRIGGER check_deliverable_tasks_completion
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.check_deliverable_tasks_completion();

-- ==================== NOTIFICATION TRIGGERS ====================

-- Notify on mention in communications
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_user_id uuid;
  actor_name text;
  entity_name text;
BEGIN
  SELECT full_name INTO actor_name FROM profiles WHERE user_id = NEW.created_by;
  
  IF NEW.entity_type = 'task' THEN
    SELECT title INTO entity_name FROM tasks WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'project' THEN
    SELECT name INTO entity_name FROM projects WHERE id = NEW.entity_id;
  END IF;
  
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      IF mentioned_user_id != NEW.created_by THEN
        INSERT INTO notifications (
          workspace_id, user_id, type, title, message, action_url,
          actor_id, related_entity_type, related_entity_id, related_entity_name
        )
        VALUES (
          NEW.workspace_id, mentioned_user_id, 'mention',
          COALESCE(actor_name, 'Quelqu''un') || ' vous a mentionné',
          NEW.content,
          CASE 
            WHEN NEW.entity_type = 'task' THEN '/tasks/' || NEW.entity_id::text
            WHEN NEW.entity_type = 'project' THEN '/projects/' || NEW.entity_id::text
            ELSE NULL
          END,
          NEW.created_by, NEW.entity_type, NEW.entity_id, entity_name
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_mention
  AFTER INSERT ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_mention();

-- Notify on team message
CREATE OR REPLACE FUNCTION public.notify_on_team_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
  channel_record RECORD;
  channel_display_name TEXT;
  author_name TEXT;
  mentioned_user_id UUID;
BEGIN
  SELECT name, channel_type INTO channel_record FROM public.team_channels WHERE id = NEW.channel_id;
  SELECT full_name INTO author_name FROM public.profiles WHERE user_id = NEW.created_by;
  
  FOR member_record IN 
    SELECT tcm.user_id FROM public.team_channel_members tcm
    WHERE tcm.channel_id = NEW.channel_id AND tcm.user_id != NEW.created_by
  LOOP
    IF NEW.mentions IS NOT NULL AND member_record.user_id = ANY(NEW.mentions) THEN
      CONTINUE;
    END IF;
    
    IF channel_record.channel_type = 'direct' THEN
      channel_display_name := COALESCE(author_name, 'une conversation');
    ELSE
      channel_display_name := COALESCE(channel_record.name, 'un canal');
    END IF;
    
    INSERT INTO public.notifications (workspace_id, user_id, type, title, message, actor_id, action_url)
    VALUES (
      NEW.workspace_id, member_record.user_id, 'new_message',
      'Nouveau message dans ' || channel_display_name,
      LEFT(NEW.content, 200), NEW.created_by, '/messages/' || NEW.channel_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_team_message
  AFTER INSERT ON public.team_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_team_message();

-- ==================== BUDGET ENVELOPE TRIGGERS ====================

-- Recalculate envelope consumption
CREATE OR REPLACE FUNCTION public.recalculate_envelope_consumption(envelope_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  env_record RECORD;
  purchases_total NUMERIC := 0;
  time_total NUMERIC := 0;
  new_consumed NUMERIC := 0;
BEGIN
  SELECT * INTO env_record FROM project_budget_envelopes WHERE id = envelope_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(SUM(amount_ht), 0) INTO purchases_total
  FROM project_purchases WHERE budget_envelope_id = envelope_id;

  SELECT COALESCE(SUM((duration_minutes / 60.0) * COALESCE(hourly_rate, 0)), 0) INTO time_total
  FROM team_time_entries WHERE budget_envelope_id = envelope_id;

  IF env_record.envelope_type = 'expenses' THEN
    new_consumed := purchases_total;
  ELSIF env_record.envelope_type = 'time' THEN
    new_consumed := time_total;
  ELSE
    new_consumed := purchases_total + time_total;
  END IF;

  UPDATE project_budget_envelopes
  SET 
    consumed_amount = new_consumed,
    remaining_amount = budget_amount - new_consumed,
    status = CASE WHEN budget_amount - new_consumed <= 0 THEN 'exhausted' ELSE 'active' END,
    updated_at = now()
  WHERE id = envelope_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_envelope_on_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.budget_envelope_id IS NOT NULL THEN
    PERFORM recalculate_envelope_consumption(OLD.budget_envelope_id);
    RETURN OLD;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.budget_envelope_id IS DISTINCT FROM NEW.budget_envelope_id THEN
    IF OLD.budget_envelope_id IS NOT NULL THEN
      PERFORM recalculate_envelope_consumption(OLD.budget_envelope_id);
    END IF;
  END IF;
  
  IF NEW.budget_envelope_id IS NOT NULL THEN
    PERFORM recalculate_envelope_consumption(NEW.budget_envelope_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_envelope_on_purchase
  AFTER INSERT OR UPDATE OR DELETE ON public.project_purchases
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_envelope_on_purchase();

CREATE TRIGGER trigger_update_envelope_on_time_entry
  AFTER INSERT OR UPDATE OR DELETE ON public.team_time_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_envelope_on_purchase();

-- ==================== ROADMAP VOTE TRIGGERS ====================

CREATE OR REPLACE FUNCTION public.update_roadmap_votes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW IS NOT NULL AND NEW.idea_id IS NOT NULL THEN
    UPDATE public.roadmap_ideas 
    SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE idea_id = NEW.idea_id AND vote_type = 'upvote')
    WHERE id = NEW.idea_id;
  ELSIF OLD IS NOT NULL AND OLD.idea_id IS NOT NULL THEN
    UPDATE public.roadmap_ideas 
    SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE idea_id = OLD.idea_id AND vote_type = 'upvote')
    WHERE id = OLD.idea_id;
  END IF;
  
  IF NEW IS NOT NULL AND NEW.roadmap_item_id IS NOT NULL THEN
    UPDATE public.roadmap_items 
    SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE roadmap_item_id = NEW.roadmap_item_id AND vote_type = 'upvote')
    WHERE id = NEW.roadmap_item_id;
  ELSIF OLD IS NOT NULL AND OLD.roadmap_item_id IS NOT NULL THEN
    UPDATE public.roadmap_items 
    SET votes_count = (SELECT COUNT(*) FROM public.roadmap_votes WHERE roadmap_item_id = OLD.roadmap_item_id AND vote_type = 'upvote')
    WHERE id = OLD.roadmap_item_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_roadmap_votes_count
  AFTER INSERT OR DELETE ON public.roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_roadmap_votes_count();

-- ==================== EMAIL TRIGGERS ====================

-- Handle inbound email reply (update pipeline entry)
CREATE TRIGGER handle_inbound_email_reply
  AFTER INSERT ON public.crm_emails
  FOR EACH ROW EXECUTE FUNCTION public.handle_inbound_email_reply();

-- Auto-associate CRM email to contact/company
CREATE TRIGGER auto_associate_crm_email
  BEFORE INSERT ON public.crm_emails
  FOR EACH ROW EXECUTE FUNCTION public.auto_associate_crm_email();

-- ==================== WORKSPACE EMAIL TRIGGERS ====================

CREATE OR REPLACE FUNCTION public.ensure_single_default_workspace_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.workspace_email_accounts
    SET is_default = false
    WHERE workspace_id = NEW.workspace_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_workspace_email
  BEFORE INSERT OR UPDATE ON public.workspace_email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_workspace_email();

-- ==================== HR TRIGGERS ====================

-- Log member employment changes
CREATE OR REPLACE FUNCTION public.log_member_employment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.salary_monthly IS DISTINCT FROM NEW.salary_monthly THEN
    INSERT INTO public.member_rate_history (
      workspace_id, user_id, change_type, old_value, new_value, effective_date, changed_by
    ) VALUES (
      NEW.workspace_id, NEW.user_id, 'salary', OLD.salary_monthly, NEW.salary_monthly, CURRENT_DATE, auth.uid()
    );
  END IF;
  
  IF OLD.client_daily_rate IS DISTINCT FROM NEW.client_daily_rate THEN
    INSERT INTO public.member_rate_history (
      workspace_id, user_id, change_type, old_value, new_value, effective_date, changed_by
    ) VALUES (
      NEW.workspace_id, NEW.user_id, 'client_rate', OLD.client_daily_rate, NEW.client_daily_rate, CURRENT_DATE, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_member_employment_changes
  AFTER UPDATE ON public.member_employment_info
  FOR EACH ROW EXECUTE FUNCTION public.log_member_employment_changes();

-- ==================== REALTIME CONFIGURATION ====================
-- Enable realtime for key tables (uncomment as needed)

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;
