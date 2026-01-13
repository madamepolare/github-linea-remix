import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import { AuthStep } from "@/components/onboarding/steps/AuthStep";
import { WorkspaceStep } from "@/components/onboarding/steps/WorkspaceStep";
import { ModulesStep } from "@/components/onboarding/steps/ModulesStep";
import { InviteStep } from "@/components/onboarding/steps/InviteStep";
import { CompleteStep } from "@/components/onboarding/steps/CompleteStep";
import { Loader2 } from "lucide-react";

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  is_core: boolean;
  price_monthly: number;
  features: string[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, workspaces } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  
  // Form data
  const [workspaceData, setWorkspaceData] = useState({ name: "", type: "" });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  const TOTAL_STEPS = 6; // Welcome, Auth, Workspace, Modules, Invite, Complete

  useEffect(() => {
    const initOnboarding = async () => {
      // Wait for auth to be ready
      if (loading) return;

      // If user is logged in and has completed onboarding with workspace
      if (user && workspaces && workspaces.length > 0 && profile?.onboarding_completed) {
        navigate("/dashboard");
        return;
      }

      // If user is invited to a workspace but hasn't completed onboarding
      if (user && workspaces && workspaces.length > 0 && !profile?.onboarding_completed) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
        
        await refreshProfile();
        navigate("/dashboard");
        return;
      }

      // If user is logged in but no workspace, skip to workspace step
      if (user && (!workspaces || workspaces.length === 0)) {
        setStep(2); // Go to workspace creation
      }

      // Fetch modules
      const { data: modulesData } = await supabase
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (modulesData) {
        setModules(modulesData as Module[]);
        setSelectedModules(modulesData.filter((m: any) => m.is_core).map((m: any) => m.id));
      }

      setIsLoading(false);
    };

    initOnboarding();
  }, [user, profile, loading, navigate, workspaces, refreshProfile]);

  const handleAuthSuccess = () => {
    // After auth, go to workspace creation
    setStep(2);
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Create workspace
      const slug = workspaceData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: workspaceData.name,
          slug: `${slug}-${Date.now()}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // 2. Add user as owner member
      await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

      // 3. Update profile with active workspace
      await supabase
        .from("profiles")
        .update({ active_workspace_id: workspace.id })
        .eq("user_id", user.id);

      // 4. Enable selected modules
      const moduleInserts = selectedModules.map((moduleId) => ({
        workspace_id: workspace.id,
        module_id: moduleId,
        enabled_by: user.id,
      }));

      if (moduleInserts.length > 0) {
        await supabase.from("workspace_modules").insert(moduleInserts);
      }

      // 5. Send invitations
      if (inviteEmails.length > 0) {
        const invitations = inviteEmails.map((email) => ({
          workspace_id: workspace.id,
          email: email.toLowerCase(),
          role: "member" as const,
          invited_by: user.id,
        }));
        await supabase.from("workspace_invites").insert(invitations);
      }

      // 6. Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      await refreshProfile();

      toast({
        title: "Bienvenue !",
        description: `${workspaceData.name} a été créé avec succès`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <OnboardingLayout currentStep={step} totalSteps={TOTAL_STEPS}>
      {step === 0 && (
        <WelcomeStep
          userName=""
          onNext={() => setStep(1)}
        />
      )}
      
      {step === 1 && (
        <AuthStep onAuthenticated={handleAuthSuccess} />
      )}
      
      {step === 2 && (
        <WorkspaceStep
          onNext={(data) => {
            setWorkspaceData(data);
            setStep(3);
          }}
          onBack={() => user ? setStep(0) : setStep(1)}
        />
      )}
      
      {step === 3 && (
        <ModulesStep
          modules={modules}
          onNext={(mods) => {
            setSelectedModules(mods);
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}
      
      {step === 4 && (
        <InviteStep
          onNext={(emails) => {
            setInviteEmails(emails);
            setStep(5);
          }}
          onBack={() => setStep(3)}
        />
      )}
      
      {step === 5 && (
        <CompleteStep
          workspaceName={workspaceData.name}
          modulesCount={selectedModules.length}
          invitesCount={inviteEmails.length}
          onComplete={handleComplete}
          isLoading={isSubmitting}
        />
      )}
    </OnboardingLayout>
  );
}
