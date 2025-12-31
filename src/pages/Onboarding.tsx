import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Hexagon,
  Building2,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Briefcase,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const workspaceSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  companySlug: z.string().min(2, "Slug must be at least 2 characters").max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

const profileSchema = z.object({
  jobTitle: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

const steps = [
  { id: 1, title: "Create Workspace", description: "Set up your company workspace" },
  { id: 2, title: "Your Profile", description: "Complete your profile details" },
  { id: 3, title: "You're Ready!", description: "Start managing your projects" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();

  const workspaceForm = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { companyName: "", companySlug: "" },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { jobTitle: "", phone: "" },
  });

  // Auto-generate slug from company name
  const companyName = workspaceForm.watch("companyName");
  useEffect(() => {
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
      workspaceForm.setValue("companySlug", slug);
    }
  }, [companyName, workspaceForm]);

  // Redirect if not logged in or already onboarded
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (profile?.onboarding_completed) {
        navigate("/");
      }
    }
  }, [user, profile, loading, navigate]);

  const handleCreateWorkspace = async (data: WorkspaceFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: data.companyName,
          slug: data.companySlug,
          created_by: user.id,
        })
        .select()
        .single();

      if (workspaceError) {
        if (workspaceError.message.includes("duplicate")) {
          toast({
            variant: "destructive",
            title: "Slug already taken",
            description: "Please choose a different workspace URL.",
          });
          setIsLoading(false);
          return;
        }
        throw workspaceError;
      }

      // Add user as owner
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      // Update profile with active workspace
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ active_workspace_id: workspace.id })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      setCreatedWorkspaceId(workspace.id);
      setCurrentStep(2);
      toast({
        title: "Workspace created!",
        description: `Welcome to ${data.companyName}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating workspace",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          job_title: data.jobTitle || null,
          phone: data.phone || null,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      setCurrentStep(3);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Hexagon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">ARCHIMIND</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 h-0.5 mx-2 mt-[-20px] ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      Create Your Workspace
                    </h2>
                    <p className="text-muted-foreground">
                      Set up your company's central hub
                    </p>
                  </div>
                </div>

                <form onSubmit={workspaceForm.handleSubmit(handleCreateWorkspace)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        placeholder="Studio Architecture"
                        className="pl-10"
                        {...workspaceForm.register("companyName")}
                      />
                    </div>
                    {workspaceForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive">
                        {workspaceForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySlug">Workspace URL</Label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        archimind.app/
                      </span>
                      <Input
                        id="companySlug"
                        placeholder="studio-architecture"
                        className="rounded-l-none"
                        {...workspaceForm.register("companySlug")}
                      />
                    </div>
                    {workspaceForm.formState.errors.companySlug && (
                      <p className="text-sm text-destructive">
                        {workspaceForm.formState.errors.companySlug.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Create Workspace
                  </Button>
                </form>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                    <Users className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      Complete Your Profile
                    </h2>
                    <p className="text-muted-foreground">
                      Tell us a bit more about yourself
                    </p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="jobTitle"
                        placeholder="Principal Architect"
                        className="pl-10"
                        {...profileForm.register("jobTitle")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+33 1 23 45 67 89"
                        className="pl-10"
                        {...profileForm.register("phone")}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Continue
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-xl p-8 text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-10 w-10 text-success" />
                  </div>
                </div>

                <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                  You're All Set!
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Your workspace is ready. Start by creating your first project, adding team members, or exploring the dashboard.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Building2 className="h-6 w-6 text-primary mx-auto mb-2" />
                    <span className="text-sm font-medium">Projects</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Users className="h-6 w-6 text-accent mx-auto mb-2" />
                    <span className="text-sm font-medium">Team</span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Briefcase className="h-6 w-6 text-success mx-auto mb-2" />
                    <span className="text-sm font-medium">CRM</span>
                  </div>
                </div>

                <Button onClick={handleComplete} size="lg" className="px-8">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
