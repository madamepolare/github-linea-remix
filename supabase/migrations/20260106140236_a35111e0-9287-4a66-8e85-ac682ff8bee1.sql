-- Create secure RPC function to accept workspace invitations
CREATE OR REPLACE FUNCTION public.accept_workspace_invite(invite_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite workspace_invites%ROWTYPE;
  v_user_email text;
  v_workspace_name text;
BEGIN
  -- Get authenticated user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get invitation
  SELECT * INTO v_invite FROM workspace_invites
  WHERE token = invite_token AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or expired');
  END IF;
  
  -- Get workspace name
  SELECT name INTO v_workspace_name FROM workspaces WHERE id = v_invite.workspace_id;
  
  -- Verify email matches
  IF lower(v_invite.email) != lower(v_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;
  
  -- Check if already a member
  IF EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = v_invite.workspace_id AND user_id = auth.uid()) THEN
    -- Delete invitation anyway
    DELETE FROM workspace_invites WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', true, 'already_member', true, 'workspace_id', v_invite.workspace_id, 'workspace_name', v_workspace_name);
  END IF;
  
  -- Add user to workspace
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role);
  
  -- Update profile's active workspace
  UPDATE profiles SET active_workspace_id = v_invite.workspace_id
  WHERE user_id = auth.uid();
  
  -- Delete invitation
  DELETE FROM workspace_invites WHERE id = v_invite.id;
  
  RETURN jsonb_build_object('success', true, 'workspace_id', v_invite.workspace_id, 'workspace_name', v_workspace_name);
END;
$$;