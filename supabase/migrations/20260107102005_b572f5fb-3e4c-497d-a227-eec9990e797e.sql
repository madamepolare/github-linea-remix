-- Table centralisée des communications
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Type de communication
  communication_type TEXT NOT NULL CHECK (communication_type IN ('comment', 'exchange', 'email_sent', 'email_received', 'note')),
  
  -- Entité source (polymorphique)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project', 'lead', 'company', 'contact', 'tender')),
  entity_id UUID NOT NULL,
  
  -- Threading
  parent_id UUID REFERENCES public.communications(id) ON DELETE CASCADE,
  thread_id UUID,
  
  -- Contenu
  title TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Mentions et pièces jointes
  mentions UUID[],
  attachments JSONB,
  
  -- Métadonnées email (futur)
  email_metadata JSONB,
  
  -- Statut
  is_read BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour requêtes rapides
CREATE INDEX idx_communications_workspace ON public.communications(workspace_id);
CREATE INDEX idx_communications_entity ON public.communications(entity_type, entity_id);
CREATE INDEX idx_communications_parent ON public.communications(parent_id);
CREATE INDEX idx_communications_thread ON public.communications(thread_id);
CREATE INDEX idx_communications_created ON public.communications(created_at DESC);

-- RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communications in their workspace" 
ON public.communications FOR SELECT 
USING (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create communications in their workspace" 
ON public.communications FOR INSERT 
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own communications" 
ON public.communications FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own communications" 
ON public.communications FOR DELETE 
USING (created_by = auth.uid());

-- Trigger updated_at
CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;

-- Migrer task_comments existants (sans parent pour l'instant)
INSERT INTO public.communications (workspace_id, communication_type, entity_type, entity_id, content, mentions, created_by, created_at)
SELECT 
  tc.workspace_id, 
  'comment', 
  'task', 
  tc.task_id,
  tc.content, 
  tc.mentions, 
  tc.author_id, 
  tc.created_at
FROM task_comments tc
WHERE tc.parent_id IS NULL;

-- Migrer task_exchanges existants (sans parent pour l'instant)
INSERT INTO public.communications (workspace_id, communication_type, entity_type, entity_id, title, content, created_by, created_at)
SELECT 
  te.workspace_id, 
  'exchange', 
  'task', 
  te.task_id,
  te.title, 
  te.content, 
  te.created_by, 
  te.created_at
FROM task_exchanges te
WHERE te.parent_id IS NULL;