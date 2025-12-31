-- Create workspace invites table for pending invitations
CREATE TABLE public.workspace_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

-- Enable RLS
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Admins and owners can view invites for their workspaces
CREATE POLICY "Admins and owners can view invites"
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (
  has_workspace_role(workspace_id, auth.uid(), 'owner'::app_role) OR 
  has_workspace_role(workspace_id, auth.uid(), 'admin'::app_role)
);

-- Admins and owners can create invites
CREATE POLICY "Admins and owners can create invites"
ON public.workspace_invites
FOR INSERT
TO authenticated
WITH CHECK (
  has_workspace_role(workspace_id, auth.uid(), 'owner'::app_role) OR 
  has_workspace_role(workspace_id, auth.uid(), 'admin'::app_role)
);

-- Admins and owners can delete invites
CREATE POLICY "Admins and owners can delete invites"
ON public.workspace_invites
FOR DELETE
TO authenticated
USING (
  has_workspace_role(workspace_id, auth.uid(), 'owner'::app_role) OR 
  has_workspace_role(workspace_id, auth.uid(), 'admin'::app_role)
);

-- Anyone can read their own invite by token (for accepting)
CREATE POLICY "Users can view invites by token"
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX idx_workspace_invites_email ON public.workspace_invites(email);