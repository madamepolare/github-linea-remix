-- Table for documentation categories
CREATE TABLE public.documentation_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT 'primary',
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.documentation_categories(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- Table for documentation pages
CREATE TABLE public.documentation_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.documentation_categories(id) ON DELETE SET NULL,
  parent_page_id UUID REFERENCES public.documentation_pages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  emoji TEXT,
  objective TEXT,
  context TEXT,
  content TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  tips TEXT,
  tags TEXT[] DEFAULT '{}',
  page_type TEXT DEFAULT 'standard',
  is_template BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_by UUID,
  last_edited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- Table for documentation templates (AI pre-fill)
CREATE TABLE public.documentation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipline TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  page_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT,
  objective TEXT,
  context TEXT,
  content TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  tips TEXT,
  tags TEXT[] DEFAULT '{}',
  page_type TEXT DEFAULT 'standard',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for documentation category templates (AI pre-fill)
CREATE TABLE public.documentation_category_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipline TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT 'primary',
  parent_slug TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_category_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documentation_categories
CREATE POLICY "Users can view their workspace documentation categories" 
ON public.documentation_categories 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documentation categories in their workspace" 
ON public.documentation_categories 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their workspace documentation categories" 
ON public.documentation_categories 
FOR UPDATE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their workspace documentation categories" 
ON public.documentation_categories 
FOR DELETE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for documentation_pages
CREATE POLICY "Users can view their workspace documentation pages" 
ON public.documentation_pages 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documentation pages in their workspace" 
ON public.documentation_pages 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their workspace documentation pages" 
ON public.documentation_pages 
FOR UPDATE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their workspace documentation pages" 
ON public.documentation_pages 
FOR DELETE 
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for templates (read-only for all authenticated users)
CREATE POLICY "Anyone can view documentation templates" 
ON public.documentation_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view documentation category templates" 
ON public.documentation_category_templates 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_documentation_categories_updated_at
BEFORE UPDATE ON public.documentation_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentation_pages_updated_at
BEFORE UPDATE ON public.documentation_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();