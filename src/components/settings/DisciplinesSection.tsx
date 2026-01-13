import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Frame, Megaphone, Check, Info, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkspaceDisciplines } from "@/hooks/useWorkspaceDisciplines";
import { type DisciplineSlug, getAvailableDisciplines } from "@/lib/tenderDisciplineConfig";
import { useDiscipline } from "@/hooks/useDiscipline";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Theater: Frame,
  Megaphone,
};

export function DisciplinesSection() {
  const { disciplines, isDisciplineActive, toggleDiscipline, hasConfigs, initializeDisciplines } = useWorkspaceDisciplines();
  const { disciplineSlug: workspacePrimaryDiscipline } = useDiscipline();
  const allDisciplines = getAvailableDisciplines();

  const handleToggle = async (slug: DisciplineSlug, currentState: boolean) => {
    // Prevent disabling the primary workspace discipline
    if (slug === workspacePrimaryDiscipline && currentState) {
      return;
    }
    
    // Ensure at least one discipline remains active
    const currentlyActive = allDisciplines.filter(d => isDisciplineActive(d.slug));
    if (currentState && currentlyActive.length <= 1) {
      return;
    }
    
    await toggleDiscipline.mutateAsync({ slug, isActive: !currentState });
  };

  const handleInitialize = async () => {
    await initializeDisciplines.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Disciplines actives</h3>
        <p className="text-sm text-muted-foreground">
          Choisissez les disciplines que vous souhaitez gérer dans ce workspace. 
          Les disciplines désactivées n'apparaîtront pas dans le sélecteur de création d'appels d'offres.
        </p>
      </div>

      {!hasConfigs && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed">
          <div>
            <p className="font-medium">Configuration par défaut</p>
            <p className="text-sm text-muted-foreground">
              Toutes les disciplines sont actuellement actives. Initialisez pour personnaliser.
            </p>
          </div>
          <Button onClick={handleInitialize} disabled={initializeDisciplines.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Personnaliser
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {allDisciplines.map((discipline, idx) => {
          const Icon = ICONS[discipline.icon] || Building2;
          const isActive = isDisciplineActive(discipline.slug);
          const isPrimary = discipline.slug === workspacePrimaryDiscipline;

          return (
            <motion.div
              key={discipline.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                isActive ? "bg-card" : "bg-muted/30 opacity-60"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg transition-colors",
                  isActive ? "bg-primary/10" : "bg-muted"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", !isActive && "text-muted-foreground")}>
                    {discipline.name}
                  </span>
                  {isPrimary && (
                    <Badge variant="secondary" className="text-xs">
                      Discipline principale
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {discipline.description}
                </p>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      {isPrimary && (
                        <Info className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggle(discipline.slug, isActive)}
                        disabled={isPrimary || toggleDiscipline.isPending}
                      />
                    </div>
                  </TooltipTrigger>
                  {isPrimary && (
                    <TooltipContent>
                      <p>La discipline principale du workspace ne peut pas être désactivée</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note :</strong> La désactivation d'une discipline masque uniquement son affichage 
              dans le sélecteur de création. Les appels d'offres existants de cette discipline restent accessibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
