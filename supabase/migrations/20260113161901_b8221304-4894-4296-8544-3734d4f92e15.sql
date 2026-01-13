-- Create company departments table
CREATE TABLE public.company_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  manager_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add department_id to contacts
ALTER TABLE public.contacts 
ADD COLUMN department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view departments in their workspace" 
ON public.company_departments 
FOR SELECT 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create departments in their workspace" 
ON public.company_departments 
FOR INSERT 
WITH CHECK (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update departments in their workspace" 
ON public.company_departments 
FOR UPDATE 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete departments in their workspace" 
ON public.company_departments 
FOR DELETE 
USING (workspace_id IN (
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_company_departments_company_id ON public.company_departments(company_id);
CREATE INDEX idx_contacts_department_id ON public.contacts(department_id);

-- Trigger for updated_at
CREATE TRIGGER update_company_departments_updated_at
BEFORE UPDATE ON public.company_departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();