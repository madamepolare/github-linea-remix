import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, Save, Check, Palette, Sofa, Theater, Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDisciplines, useWorkspaceDiscipline } from "@/hooks/useDiscipline";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const DISCIPLINE_ICONS: Record<string, React.ElementType> = {
  architecture: Building2,
  interior: Sofa,
  scenography: Theater,
  communication: Megaphone,
};

const DISCIPLINE_COLORS: Record<string, string> = {
  architecture: "from-blue-500 to-cyan-500",
  interior: "from-amber-500 to-orange-500",
  scenography: "from-purple-500 to-pink-500",
  communication: "from-emerald-500 to-teal-500",
};

export function DisciplineSettings() {
  const { activeWorkspace, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { data: disciplines, isLoading: isLoadingDisciplines } = useDisciplines();
  const { data: currentDiscipline, isLoading: isLoadingCurrent } = useWorkspaceDiscipline();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!activeWorkspace || !selectedDiscipline) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ discipline_id: selectedDiscipline })
        .eq("id", activeWorkspace.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Discipline mise à jour",
        description: "Les modules et terminologies ont été adaptés.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeDisciplineId = selectedDiscipline || currentDiscipline?.id;

  if (!activeWorkspace) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Aucun workspace sélectionné</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Discipline
              </CardTitle>
              <CardDescription>
                Choisissez votre métier pour adapter les modules, terminologies et templates
              </CardDescription>
            </div>
            {currentDiscipline && (
              <Badge variant="secondary" className="capitalize">
                {currentDiscipline.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingDisciplines || isLoadingCurrent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {disciplines?.filter(d => d.is_active).map((discipline) => {
                  const Icon = DISCIPLINE_ICONS[discipline.slug] || Building2;
                  const isSelected = activeDisciplineId === discipline.id;
                  const gradientClass = DISCIPLINE_COLORS[discipline.slug] || "from-gray-500 to-gray-600";
                  
                  return (
                    <button
                      key={discipline.id}
                      onClick={() => setSelectedDiscipline(discipline.id)}
                      className={cn(
                        "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                        gradientClass
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-foreground">{discipline.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {discipline.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedDiscipline && selectedDiscipline !== currentDiscipline?.id && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Attention :</strong> Changer de discipline adaptera les modules disponibles, 
                    les terminologies (ex: "Chantier" → "Production") et les templates par défaut. 
                    Vos données existantes ne seront pas supprimées.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || !selectedDiscipline || selectedDiscipline === currentDiscipline?.id}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modules recommandés pour la discipline */}
      {currentDiscipline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modules recommandés</CardTitle>
            <CardDescription>
              Modules adaptés à votre discipline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentDiscipline.slug === 'architecture' && (
                <>
                  <Badge variant="secondary">Projets</Badge>
                  <Badge variant="secondary">Chantier</Badge>
                  <Badge variant="secondary">Appels d'offres</Badge>
                  <Badge variant="secondary">Références</Badge>
                </>
              )}
              {currentDiscipline.slug === 'interior' && (
                <>
                  <Badge variant="secondary">Projets</Badge>
                  <Badge variant="secondary">Mobilier</Badge>
                  <Badge variant="secondary">Fournisseurs</Badge>
                  <Badge variant="secondary">Références</Badge>
                </>
              )}
              {currentDiscipline.slug === 'scenography' && (
                <>
                  <Badge variant="secondary">Projets</Badge>
                  <Badge variant="secondary">Planning Production</Badge>
                  <Badge variant="secondary">Fournisseurs</Badge>
                  <Badge variant="secondary">Références</Badge>
                </>
              )}
              {currentDiscipline.slug === 'communication' && (
                <>
                  <Badge variant="secondary">Campagnes</Badge>
                  <Badge variant="secondary">Planning Média</Badge>
                  <Badge variant="secondary">CRM</Badge>
                  <Badge variant="secondary">Commercial</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
