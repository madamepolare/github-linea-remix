import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDisciplines } from "@/hooks/useDiscipline";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import { DisciplineStep } from "@/components/onboarding/steps/DisciplineStep";
import { WorkspaceStep } from "@/components/onboarding/steps/WorkspaceStep";
import { ModulesStep } from "@/components/onboarding/steps/ModulesStep";
import { AuthStep } from "@/components/onboarding/steps/AuthStep";
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

// Recommended modules per discipline
const DISCIPLINE_RECOMMENDED_MODULES: Record<string, string[]> = {
  architecture: ["projects", "commercial", "tenders", "chantier", "documents"],
  interior: ["projects", "commercial", "objects", "materials", "documents"],
  scenography: ["projects", "commercial", "campaigns", "documents"],
  communication: ["crm", "campaigns", "commercial", "documents"],
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, workspaces } = useAuth();
  const { data: disciplines, isLoading: isLoadingDisciplines } = useDisciplines();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  
  // Form data (collected before auth)
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [workspaceData, setWorkspaceData] = useState({ name: "", type: "" });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const TOTAL_STEPS = 5; // Welcome, Discipline, Workspace, Modules, Auth

  useEffect(() => {
    const initOnboarding = async () => {
      if (loading) return;

      // If user is already logged in and has completed onboarding
      if (user && workspaces && workspaces.length > 0 && profile?.onboarding_completed) {
        navigate("/dashboard");
        return;
      }

      // If user is invited to a workspace
      if (user && workspaces && workspaces.length > 0 && !profile?.onboarding_completed) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
        await refreshProfile();
        navigate("/dashboard");
        return;
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

  const handleDisciplineSelect = (disciplineId: string) => {
    setSelectedDiscipline(disciplineId);
    
    // Find discipline slug and pre-select recommended modules
    const discipline = disciplines?.find(d => d.id === disciplineId);
    if (discipline && DISCIPLINE_RECOMMENDED_MODULES[discipline.slug]) {
      const recommendedSlugs = DISCIPLINE_RECOMMENDED_MODULES[discipline.slug];
      const coreIds = modules.filter(m => m.is_core).map(m => m.id);
      const recommendedIds = modules.filter(m => recommendedSlugs.includes(m.slug)).map(m => m.id);
      setSelectedModules([...new Set([...coreIds, ...recommendedIds])]);
    }
    
    setStep(2);
  };

  const handleAuthSuccess = async () => {
    // After auth, create the workspace with all the collected data
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

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
          created_by: currentUser.id,
          discipline_id: selectedDiscipline || null,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // 2. Add user as owner
      await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: currentUser.id,
        role: "owner",
      });

      // 3. Update profile
      await supabase
        .from("profiles")
        .update({ 
          active_workspace_id: workspace.id,
          onboarding_completed: true 
        })
        .eq("user_id", currentUser.id);

      // 4. Enable modules
      if (selectedModules.length > 0) {
        const moduleInserts = selectedModules.map((moduleId) => ({
          workspace_id: workspace.id,
          module_id: moduleId,
          enabled_by: currentUser.id,
        }));
        await supabase.from("workspace_modules").insert(moduleInserts);
      }

      await refreshProfile();

      toast({
        title: "Bienvenue sur LINEA ! 🎉",
        description: `${workspaceData.name} est prêt`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get recommended module slugs for current discipline
  const getRecommendedSlugs = () => {
    const discipline = disciplines?.find(d => d.id === selectedDiscipline);
    return discipline ? DISCIPLINE_RECOMMENDED_MODULES[discipline.slug] || [] : [];
  };

  if (loading || isLoading || isLoadingDisciplines) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
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
        <DisciplineStep
          disciplines={disciplines || []}
          onNext={handleDisciplineSelect}
          onBack={() => setStep(0)}
        />
      )}
      
      {step === 2 && (
        <WorkspaceStep
          onNext={(data) => {
            setWorkspaceData(data);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      
      {step === 3 && (
        <ModulesStep
          modules={modules}
          recommendedSlugs={getRecommendedSlugs()}
          onNext={(mods) => {
            setSelectedModules(mods);
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}
      
      {step === 4 && (
        <AuthStep
          workspaceName={workspaceData.name}
          modulesCount={selectedModules.length}
          onAuthenticated={handleAuthSuccess}
          onBack={() => setStep(3)}
        />
      )}
    </OnboardingLayout>
  );
}
