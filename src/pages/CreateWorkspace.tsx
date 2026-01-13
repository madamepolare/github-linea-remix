import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const workspaceSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile, setActiveWorkspace } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
  });

  const onSubmit = async (data: WorkspaceFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const slug = generateSlug(data.name);

      // Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: data.name,
          slug: slug,
          plan: "free",
        })
        .select()
        .single();

      if (workspaceError) {
        if (workspaceError.code === "23505") {
          toast({
            title: "Erreur",
            description: "Un workspace avec ce nom existe déjà",
            variant: "destructive",
          });
        } else {
          throw workspaceError;
        }
        return;
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

      // Set as active workspace
      await setActiveWorkspace(workspace.id);
      await refreshProfile();

      const newSlug = generateSlug(data.name);
      
      toast({
        title: "Workspace créé",
        description: `${data.name} a été créé avec succès`,
      });

      // Navigate to the new workspace
      navigate(`/${newSlug}`);
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le workspace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Créer un nouveau workspace</CardTitle>
            <CardDescription>
              Un workspace vous permet de gérer une agence ou une équipe distincte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du workspace *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Mon Agence, DOMINI, Madame Polare..."
                  {...register("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez brièvement ce workspace..."
                  rows={3}
                  {...register("description")}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">Ce qui sera créé :</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Un workspace séparé avec ses propres données</li>
                  <li>• Vous serez le propriétaire (owner) de ce workspace</li>
                  <li>• Vous pourrez inviter des membres par la suite</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer le workspace"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
