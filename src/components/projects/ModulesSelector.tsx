import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectModules, ModuleKey, AVAILABLE_MODULES } from "@/hooks/useProjectModules";
import { HardHat, Trophy, FileStack, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const iconMap = {
  HardHat,
  Trophy,
  FileStack,
};

const colorMap: Record<string, string> = {
  orange: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

interface ModulesSelectorProps {
  projectId: string;
  compact?: boolean;
}

export function ModulesSelector({ projectId, compact = false }: ModulesSelectorProps) {
  const { enabledModules, isLoading, toggleModule, isModuleEnabled, enableModule, disableModule } = useProjectModules(projectId);
  const navigate = useNavigate();

  const handleModuleClick = (moduleKey: ModuleKey) => {
    if (isModuleEnabled(moduleKey)) {
      // Navigate to the module
      if (moduleKey === "chantier") {
        navigate(`/chantier/${projectId}`);
      } else if (moduleKey === "concours") {
        navigate(`/tenders?project=${projectId}`);
      } else if (moduleKey === "documents") {
        navigate(`/documents?project=${projectId}`);
      }
    }
  };

  const handleToggle = async (moduleKey: ModuleKey, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleModule(moduleKey);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_MODULES.map((module) => {
          const Icon = iconMap[module.icon as keyof typeof iconMap];
          const enabled = isModuleEnabled(module.key);
          
          return (
            <Badge
              key={module.key}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all gap-1.5 py-1 px-2",
                enabled ? colorMap[module.color] : "opacity-50 hover:opacity-75"
              )}
              onClick={() => enabled ? handleModuleClick(module.key) : toggleModule(module.key)}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {module.name}
              {!enabled && (
                <span className="text-[10px] text-muted-foreground ml-1">+</span>
              )}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Modules du projet</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AVAILABLE_MODULES.map((module) => {
          const Icon = iconMap[module.icon as keyof typeof iconMap];
          const enabled = isModuleEnabled(module.key);
          const isPending = enableModule.isPending || disableModule.isPending;
          
          return (
            <Card 
              key={module.key}
              className={cn(
                "cursor-pointer transition-all border",
                enabled 
                  ? "border-primary/30 bg-primary/5 shadow-sm" 
                  : "border-border hover:border-muted-foreground/30"
              )}
              onClick={() => enabled && handleModuleClick(module.key)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      enabled ? colorMap[module.color] : "bg-muted text-muted-foreground"
                    )}>
                      {Icon && <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        !enabled && "text-muted-foreground"
                      )}>
                        {module.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    disabled={isPending}
                    onClick={(e) => handleToggle(module.key, e)}
                    className="shrink-0"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
