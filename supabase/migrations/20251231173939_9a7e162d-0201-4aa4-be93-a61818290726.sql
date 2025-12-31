-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;

-- Create permissive policy instead
CREATE POLICY "Users can create workspaces" 
ON public.workspaces 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);