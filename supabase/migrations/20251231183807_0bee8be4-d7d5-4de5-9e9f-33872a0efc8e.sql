-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  client TEXT,
  phase TEXT DEFAULT 'planning',
  status TEXT DEFAULT 'active',
  color TEXT DEFAULT '#000000',
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_members junction table for team assignments
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Workspace members can view projects" 
ON public.projects 
FOR SELECT 
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update projects" 
ON public.projects 
FOR UPDATE 
USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete projects" 
ON public.projects 
FOR DELETE 
USING (is_workspace_member(workspace_id, auth.uid()));

-- RLS policies for project_members
CREATE POLICY "Users can view project members" 
ON public.project_members 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.projects WHERE is_workspace_member(workspace_id, auth.uid())
));

CREATE POLICY "Workspace members can manage project members" 
ON public.project_members 
FOR ALL 
USING (project_id IN (
  SELECT id FROM public.projects WHERE is_workspace_member(workspace_id, auth.uid())
));

-- Add foreign key from tasks to projects
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();