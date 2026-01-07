import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, Loader2, Check, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface InviteDetails {
  id: string;
  email: string;
  role: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  expires_at: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      fetchInvite();
    } else {
      setError("Invalid invitation link");
      setIsLoading(false);
    }
  }, [token]);

  const fetchInvite = async () => {
    try {
      // Use RPC function to bypass RLS - allows unauthenticated users to view invite by token
      const { data, error } = await supabase
        .rpc('get_invite_by_token', { invite_token: token });

      if (error || !data || data.length === 0) {
        setError("Invitation not found or has expired");
        setIsLoading(false);
        return;
      }

      const inviteData = data[0];
      setInvite({
        id: inviteData.id,
        email: inviteData.email,
        role: inviteData.role,
        workspace: {
          id: inviteData.workspace_id,
          name: inviteData.workspace_name,
          slug: inviteData.workspace_slug,
        },
        expires_at: inviteData.expires_at,
      });
      setIsLoading(false);
    } catch (err: any) {
      setError("Error loading invitation");
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invite || !user) return;
    setIsAccepting(true);

    try {
      // Use secure RPC function to accept invitation
      const { data, error } = await supabase.rpc('accept_workspace_invite', {
        invite_token: token
      });

      if (error) throw error;

      // Cast the response to the expected type
      const result = data as { success: boolean; error?: string; already_member?: boolean; workspace_name?: string; workspace_id?: string } | null;

      if (!result || !result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.error || "Impossible d'accepter l'invitation",
        });
        setIsAccepting(false);
        return;
      }

      // Clear pending invite from sessionStorage
      sessionStorage.removeItem('pendingInviteToken');
      sessionStorage.removeItem('pendingInviteEmail');
      sessionStorage.removeItem('pendingInviteWorkspace');
      sessionStorage.removeItem('pendingInviteRole');

      // Refresh profile to get new workspace
      await refreshProfile();

      if (result.already_member) {
        toast({
          title: "Déjà membre",
          description: `Vous êtes déjà membre de ${result.workspace_name}`,
        });
        navigate("/");
      } else {
        toast({
          title: "Bienvenue dans l'équipe !",
          description: `Vous avez rejoint ${result.workspace_name}`,
        });
        // Redirect to onboarding for profile completion
        navigate("/onboarding");
      }
    } catch (err: any) {
      console.error("Error accepting invite:", err);
      toast({
        variant: "destructive",
        title: "Erreur lors de l'acceptation",
        description: err.message || "Une erreur est survenue",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate("/");
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, redirect to auth with return URL and invite info
  if (!user && invite) {
    // Store invite info in sessionStorage so it persists through signup/login
    sessionStorage.setItem('pendingInviteToken', token || '');
    sessionStorage.setItem('pendingInviteEmail', invite.email);
    sessionStorage.setItem('pendingInviteWorkspace', invite.workspace.name);
    sessionStorage.setItem('pendingInviteRole', invite.role);
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <Hexagon className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold">ARCHIMIND</h1>
          </div>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Rejoignez {invite.workspace.name}
              </h2>
              <p className="text-muted-foreground mb-2">
                Vous avez été invité en tant que <strong className="text-foreground">{invite.role}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Connectez-vous ou créez un compte avec l'adresse <strong>{invite.email}</strong> pour accepter.
              </p>
              <Button
                onClick={() => navigate(`/auth?redirect=/invite?token=${token}&email=${encodeURIComponent(invite.email)}`)}
                className="w-full"
              >
                Continuer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <X className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Hexagon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">ARCHIMIND</h1>
        </div>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Join {invite?.workspace.name}
            </h2>
            <p className="text-muted-foreground mb-2">
              You've been invited as a <strong className="text-foreground">{invite?.role}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Invitation sent to {invite?.email}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDecline} className="flex-1">
                Decline
              </Button>
              <Button onClick={handleAccept} disabled={isAccepting} className="flex-1">
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
