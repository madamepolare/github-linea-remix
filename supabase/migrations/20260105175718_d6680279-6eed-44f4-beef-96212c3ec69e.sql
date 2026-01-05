-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can view invites by token" ON public.workspace_invites;

-- Recreate the policy using auth.email() instead of querying auth.users
CREATE POLICY "Users can view their own invites"
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (email = auth.email());