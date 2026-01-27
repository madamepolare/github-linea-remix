-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 9: RLS POLICIES
-- =====================================================
-- Row Level Security policies for all tables
-- =====================================================

-- Note: This is a representative set of RLS policies.
-- The actual policies are generated dynamically based on the workspace membership.

-- ==================== CORE TABLES ====================

-- Workspaces policies
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can update workspaces" ON public.workspaces
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Workspace members policies
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- User roles policies
CREATE POLICY "Users can view roles in their workspaces" ON public.user_roles
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Profiles policies
CREATE POLICY "Users can view profiles in their workspaces" ON public.profiles
  FOR SELECT USING (
    user_id IN (
      SELECT wm2.user_id FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ==================== CRM TABLES ====================

-- CRM Companies policies
CREATE POLICY "Workspace members can view companies" ON public.crm_companies
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create companies" ON public.crm_companies
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update companies" ON public.crm_companies
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete companies" ON public.crm_companies
  FOR DELETE USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- Contacts policies
CREATE POLICY "Workspace members can view contacts" ON public.contacts
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update contacts" ON public.contacts
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- Leads policies
CREATE POLICY "Workspace members can manage leads" ON public.leads
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- Pipelines policies
CREATE POLICY "Workspace members can view pipelines" ON public.crm_pipelines
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can manage pipelines" ON public.crm_pipelines
  FOR ALL USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- Pipeline stages policies
CREATE POLICY "Workspace members can view pipeline stages" ON public.crm_pipeline_stages
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can manage pipeline stages" ON public.crm_pipeline_stages
  FOR ALL USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- ==================== COMMERCIAL TABLES ====================

-- Commercial documents policies
CREATE POLICY "Workspace members can view commercial documents" ON public.commercial_documents
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create commercial documents" ON public.commercial_documents
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update commercial documents" ON public.commercial_documents
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete commercial documents" ON public.commercial_documents
  FOR DELETE USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- Document phases policies
CREATE POLICY "Workspace members can manage document phases" ON public.commercial_document_phases
  FOR ALL USING (
    document_id IN (
      SELECT id FROM commercial_documents WHERE is_workspace_member(workspace_id, auth.uid())
    )
  );

-- Invoices policies
CREATE POLICY "Workspace members can view invoices" ON public.invoices
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update invoices" ON public.invoices
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete invoices" ON public.invoices
  FOR DELETE USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- ==================== PROJECT TABLES ====================

-- Projects policies
CREATE POLICY "Workspace members can view projects" ON public.projects
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create projects" ON public.projects
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update projects" ON public.projects
  FOR UPDATE USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- Tasks policies
CREATE POLICY "Workspace members can manage tasks" ON public.tasks
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- Project phases policies
CREATE POLICY "Workspace members can manage project phases" ON public.project_phases
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- Project deliverables policies
CREATE POLICY "Workspace members can manage deliverables" ON public.project_deliverables
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- ==================== TEAM TABLES ====================

-- Team time entries policies
CREATE POLICY "Users can view time entries in their workspace" ON public.team_time_entries
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create their own time entries" ON public.team_time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update their own time entries" ON public.team_time_entries
  FOR UPDATE USING (user_id = auth.uid() OR has_role_or_higher(auth.uid(), workspace_id, 'admin'));

CREATE POLICY "Admins can delete time entries" ON public.team_time_entries
  FOR DELETE USING (has_role_or_higher(auth.uid(), workspace_id, 'admin'));

-- Team absences policies
CREATE POLICY "Users can view absences in their workspace" ON public.team_absences
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can create their own absence requests" ON public.team_absences
  FOR INSERT WITH CHECK (
    (user_id = auth.uid() AND is_workspace_member(workspace_id, auth.uid()))
    OR has_role_or_higher(auth.uid(), workspace_id, 'admin')
  );

CREATE POLICY "Users can update their pending absences or admins can update all" ON public.team_absences
  FOR UPDATE USING (
    (user_id = auth.uid() AND status = 'pending')
    OR has_role_or_higher(auth.uid(), workspace_id, 'admin')
  );

-- Team channels policies
CREATE POLICY "Workspace members can view public channels" ON public.team_channels
  FOR SELECT USING (
    is_workspace_member(workspace_id, auth.uid()) AND
    (channel_type = 'public' OR id IN (SELECT channel_id FROM team_channel_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can create channels" ON public.team_channels
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

-- Team messages policies
CREATE POLICY "Channel members can view messages" ON public.team_messages
  FOR SELECT USING (
    channel_id IN (SELECT channel_id FROM team_channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Channel members can create messages" ON public.team_messages
  FOR INSERT WITH CHECK (
    channel_id IN (SELECT channel_id FROM team_channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own messages" ON public.team_messages
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.team_messages
  FOR DELETE USING (created_by = auth.uid());

-- ==================== TENDER TABLES ====================

-- Tenders policies
CREATE POLICY "Workspace members can manage tenders" ON public.tenders
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- Tender team policies
CREATE POLICY "Workspace members can manage tender team" ON public.tender_team
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- Tender documents policies
CREATE POLICY "Workspace members can manage tender documents" ON public.tender_documents
  FOR ALL USING (is_workspace_member(workspace_id, auth.uid()));

-- ==================== MISC TABLES ====================

-- Communications policies
CREATE POLICY "Workspace members can view communications" ON public.communications
  FOR SELECT USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create communications" ON public.communications
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update their own communications" ON public.communications
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own communications" ON public.communications
  FOR DELETE USING (created_by = auth.uid());

-- Gmail connections policies
CREATE POLICY "Users can manage their own gmail connections" ON public.gmail_connections
  FOR ALL USING (user_id = auth.uid());

-- Dashboard layouts policies
CREATE POLICY "Users can manage their own dashboard layouts" ON public.dashboard_layouts
  FOR ALL USING (user_id = auth.uid());

-- Quick tasks policies
CREATE POLICY "Users can manage their own quick tasks" ON public.quick_tasks
  FOR ALL USING (user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());
