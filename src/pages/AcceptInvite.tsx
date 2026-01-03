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
      const { data, error } = await supabase
        .from("workspace_invites")
        .select(`
          id,
          email,
          role,
          expires_at,
          workspace:workspaces(id, name, slug)
        `)
        .eq("token", token)
        .single();

      if (error || !data) {
        setError("Invitation not found or has expired");
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        setIsLoading(false);
        return;
      }

      setInvite({
        id: data.id,
        email: data.email,
        role: data.role,
        workspace: data.workspace as any,
        expires_at: data.expires_at,
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
      // Check if user email matches invite email
      if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        toast({
          variant: "destructive",
          title: "Email mismatch",
          description: `This invitation was sent to ${invite.email}. Please sign in with that email.`,
        });
        setIsAccepting(false);
        return;
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: invite.workspace.id,
          user_id: user.id,
          role: invite.role as any,
        });

      if (memberError) {
        if (memberError.message.includes("duplicate")) {
          toast({
            title: "Already a member",
            description: "You're already a member of this workspace.",
          });
        } else {
          throw memberError;
        }
      }

      // Delete the invite
      await supabase
        .from("workspace_invites")
        .delete()
        .eq("id", invite.id);

      // Update active workspace
      await supabase
        .from("profiles")
        .update({ active_workspace_id: invite.workspace.id })
        .eq("user_id", user.id);

      await refreshProfile();

      toast({
        title: "Welcome to the team!",
        description: `You've joined ${invite.workspace.name}`,
      });

      navigate("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error accepting invite",
        description: err.message,
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

  // If not logged in, redirect to auth with return URL
  if (!user && invite) {
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
            <h1 className="font-display text-2xl font-bold">LINEA SUITE</h1>
          </div>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                You're invited to join {invite.workspace.name}
              </h2>
              <p className="text-muted-foreground mb-6">
                Sign in or create an account to accept this invitation.
              </p>
              <Button
                onClick={() => navigate(`/auth?redirect=/invite?token=${token}`)}
                className="w-full"
              >
                Sign In to Accept
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
          <h1 className="font-display text-2xl font-bold">LINEA SUITE</h1>
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
