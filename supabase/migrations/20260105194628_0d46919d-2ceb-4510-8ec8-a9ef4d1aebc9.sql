-- Create object categories table
CREATE TABLE public.object_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES public.object_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- Create design objects table
CREATE TABLE public.design_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.object_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  designer TEXT,
  description TEXT,
  dimensions TEXT,
  materials TEXT,
  colors TEXT[],
  price_min NUMERIC,
  price_max NUMERIC,
  currency TEXT DEFAULT 'EUR',
  source_url TEXT,
  source_name TEXT,
  image_url TEXT,
  images TEXT[],
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project objects junction table
CREATE TABLE public.project_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  object_id UUID NOT NULL REFERENCES public.design_objects(id) ON DELETE CASCADE,
  room TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'proposed',
  notes TEXT,
  added_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, object_id)
);

-- Enable RLS
ALTER TABLE public.object_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_objects ENABLE ROW LEVEL SECURITY;

-- RLS policies for object_categories
CREATE POLICY "Users can view object categories in their workspace"
  ON public.object_categories FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create object categories in their workspace"
  ON public.object_categories FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update object categories in their workspace"
  ON public.object_categories FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete object categories in their workspace"
  ON public.object_categories FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- RLS policies for design_objects
CREATE POLICY "Users can view design objects in their workspace"
  ON public.design_objects FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create design objects in their workspace"
  ON public.design_objects FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update design objects in their workspace"
  ON public.design_objects FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete design objects in their workspace"
  ON public.design_objects FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- RLS policies for project_objects
CREATE POLICY "Users can view project objects"
  ON public.project_objects FOR SELECT
  USING (project_id IN (
    SELECT id FROM public.projects 
    WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can manage project objects"
  ON public.project_objects FOR ALL
  USING (project_id IN (
    SELECT id FROM public.projects 
    WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  ));

-- Trigger for updated_at
CREATE TRIGGER update_design_objects_updated_at
  BEFORE UPDATE ON public.design_objects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();