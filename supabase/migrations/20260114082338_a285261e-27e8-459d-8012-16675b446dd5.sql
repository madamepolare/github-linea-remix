-- Create project_knowledge table for storing project-related information
CREATE TABLE public.project_knowledge (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    element_type TEXT NOT NULL DEFAULT 'note',
    category TEXT DEFAULT 'reference',
    url TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    credential_data JSONB,
    metadata JSONB,
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    is_sensitive BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'all',
    sort_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_project_knowledge_project_id ON public.project_knowledge(project_id);
CREATE INDEX idx_project_knowledge_workspace_id ON public.project_knowledge(workspace_id);
CREATE INDEX idx_project_knowledge_element_type ON public.project_knowledge(element_type);
CREATE INDEX idx_project_knowledge_category ON public.project_knowledge(category);

-- Enable RLS
ALTER TABLE public.project_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view project knowledge in their workspace"
ON public.project_knowledge
FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create project knowledge in their workspace"
ON public.project_knowledge
FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update project knowledge in their workspace"
ON public.project_knowledge
FOR UPDATE
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete project knowledge in their workspace"
ON public.project_knowledge
FOR DELETE
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_project_knowledge_updated_at
    BEFORE UPDATE ON public.project_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();