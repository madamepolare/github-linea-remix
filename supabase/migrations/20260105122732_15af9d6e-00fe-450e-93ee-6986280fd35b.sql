-- =====================================================
-- DOCUMENT EXPIRATION REMINDERS
-- =====================================================
CREATE TABLE public.document_expiration_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.agency_documents(id) ON DELETE CASCADE NOT NULL,
  reminder_date date NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('7_days', '30_days', '60_days', 'expired')),
  is_sent boolean DEFAULT false,
  is_read boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_expiration_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders in their workspace" ON public.document_expiration_reminders
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update reminders in their workspace" ON public.document_expiration_reminders
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE INDEX idx_document_expiration_reminders_workspace ON public.document_expiration_reminders(workspace_id);
CREATE INDEX idx_document_expiration_reminders_document ON public.document_expiration_reminders(document_id);

-- =====================================================
-- DOCUMENT SIGNATURES
-- =====================================================
CREATE TABLE public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.agency_documents(id) ON DELETE CASCADE NOT NULL,
  requested_by uuid NOT NULL,
  signature_type text NOT NULL DEFAULT 'simple' CHECK (signature_type IN ('simple', 'advanced')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'expired', 'cancelled')),
  message text,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures in their workspace" ON public.document_signatures
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can insert signatures in their workspace" ON public.document_signatures
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update signatures in their workspace" ON public.document_signatures
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE INDEX idx_document_signatures_workspace ON public.document_signatures(workspace_id);
CREATE INDEX idx_document_signatures_document ON public.document_signatures(document_id);

-- =====================================================
-- DOCUMENT SIGNERS
-- =====================================================
CREATE TABLE public.document_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_id uuid REFERENCES public.document_signatures(id) ON DELETE CASCADE NOT NULL,
  signer_email text NOT NULL,
  signer_name text NOT NULL,
  signer_role text CHECK (signer_role IN ('client', 'agency', 'witness', 'other')),
  sign_order integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'rejected')),
  token uuid DEFAULT gen_random_uuid() UNIQUE,
  signed_at timestamptz,
  signature_data jsonb,
  signature_image text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signers for signatures in their workspace" ON public.document_signers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_signatures ds 
      WHERE ds.id = signature_id 
      AND public.is_workspace_member(ds.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can insert signers" ON public.document_signers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_signatures ds 
      WHERE ds.id = signature_id 
      AND public.is_workspace_member(ds.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update signers" ON public.document_signers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.document_signatures ds 
      WHERE ds.id = signature_id 
      AND public.is_workspace_member(ds.workspace_id, auth.uid())
    )
  );

-- Allow public access by token for signing
CREATE POLICY "Public can view signer by token" ON public.document_signers
  FOR SELECT USING (token IS NOT NULL);

CREATE POLICY "Public can update signer by token" ON public.document_signers
  FOR UPDATE USING (token IS NOT NULL);

CREATE INDEX idx_document_signers_signature ON public.document_signers(signature_id);
CREATE INDEX idx_document_signers_token ON public.document_signers(token);

-- =====================================================
-- DOCUMENT SIGNATURE EVENTS (Tracking)
-- =====================================================
CREATE TABLE public.document_signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_id uuid REFERENCES public.document_signatures(id) ON DELETE CASCADE NOT NULL,
  signer_id uuid REFERENCES public.document_signers(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'sent', 'viewed', 'signed', 'rejected', 'reminder_sent', 'expired', 'cancelled')),
  event_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_signature_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their workspace" ON public.document_signature_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_signatures ds 
      WHERE ds.id = signature_id 
      AND public.is_workspace_member(ds.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Anyone can insert events" ON public.document_signature_events
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_document_signature_events_signature ON public.document_signature_events(signature_id);

-- =====================================================
-- DOCUMENT WORKFLOWS
-- =====================================================
CREATE TABLE public.document_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  document_types text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflows in their workspace" ON public.document_workflows
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can insert workflows in their workspace" ON public.document_workflows
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can update workflows in their workspace" ON public.document_workflows
  FOR UPDATE USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can delete workflows in their workspace" ON public.document_workflows
  FOR DELETE USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE INDEX idx_document_workflows_workspace ON public.document_workflows(workspace_id);

-- =====================================================
-- DOCUMENT WORKFLOW STEPS
-- =====================================================
CREATE TABLE public.document_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.document_workflows(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  name text NOT NULL,
  approver_type text NOT NULL CHECK (approver_type IN ('user', 'role', 'any')),
  approver_user_id uuid,
  approver_role text CHECK (approver_role IN ('owner', 'admin', 'member')),
  is_required boolean DEFAULT true,
  auto_approve_after_days integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps for workflows in their workspace" ON public.document_workflow_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_workflows dw 
      WHERE dw.id = workflow_id 
      AND public.is_workspace_member(dw.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can insert steps" ON public.document_workflow_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_workflows dw 
      WHERE dw.id = workflow_id 
      AND public.is_workspace_member(dw.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update steps" ON public.document_workflow_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.document_workflows dw 
      WHERE dw.id = workflow_id 
      AND public.is_workspace_member(dw.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete steps" ON public.document_workflow_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.document_workflows dw 
      WHERE dw.id = workflow_id 
      AND public.is_workspace_member(dw.workspace_id, auth.uid())
    )
  );

CREATE INDEX idx_document_workflow_steps_workflow ON public.document_workflow_steps(workflow_id);

-- =====================================================
-- DOCUMENT APPROVAL INSTANCES
-- =====================================================
CREATE TABLE public.document_approval_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.agency_documents(id) ON DELETE CASCADE NOT NULL,
  workflow_id uuid REFERENCES public.document_workflows(id) ON DELETE SET NULL,
  current_step integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
  started_by uuid NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.document_approval_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approval instances" ON public.document_approval_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agency_documents ad 
      WHERE ad.id = document_id 
      AND public.is_workspace_member(ad.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can insert approval instances" ON public.document_approval_instances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_documents ad 
      WHERE ad.id = document_id 
      AND public.is_workspace_member(ad.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update approval instances" ON public.document_approval_instances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agency_documents ad 
      WHERE ad.id = document_id 
      AND public.is_workspace_member(ad.workspace_id, auth.uid())
    )
  );

CREATE INDEX idx_document_approval_instances_document ON public.document_approval_instances(document_id);

-- =====================================================
-- DOCUMENT APPROVALS
-- =====================================================
CREATE TABLE public.document_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES public.document_approval_instances(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES public.document_workflow_steps(id) ON DELETE SET NULL,
  approver_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comment text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals" ON public.document_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_approval_instances dai
      JOIN public.agency_documents ad ON ad.id = dai.document_id
      WHERE dai.id = instance_id 
      AND public.is_workspace_member(ad.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can insert approvals" ON public.document_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_approval_instances dai
      JOIN public.agency_documents ad ON ad.id = dai.document_id
      WHERE dai.id = instance_id 
      AND public.is_workspace_member(ad.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can update approvals" ON public.document_approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.document_approval_instances dai
      JOIN public.agency_documents ad ON ad.id = dai.document_id
      WHERE dai.id = instance_id 
      AND public.is_workspace_member(ad.workspace_id, auth.uid())
    )
  );

CREATE INDEX idx_document_approvals_instance ON public.document_approvals(instance_id);

-- =====================================================
-- ALTER document_templates for visual editor
-- =====================================================
ALTER TABLE public.document_templates 
  ADD COLUMN IF NOT EXISTS header_html text,
  ADD COLUMN IF NOT EXISTS footer_html text,
  ADD COLUMN IF NOT EXISTS body_template text,
  ADD COLUMN IF NOT EXISTS styles jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS preview_image text;

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE TRIGGER update_document_signatures_updated_at
  BEFORE UPDATE ON public.document_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at
  BEFORE UPDATE ON public.document_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();