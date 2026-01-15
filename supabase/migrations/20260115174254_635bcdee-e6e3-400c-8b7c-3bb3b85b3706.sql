-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view sub-projects of their projects" ON public.projects;