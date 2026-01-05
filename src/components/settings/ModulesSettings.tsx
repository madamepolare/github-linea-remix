import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderKanban, 
  Users, 
  CheckSquare, 
  FileStack, 
  FileText, 
  Receipt, 
  Gavel, 
  HardHat, 
  UserCog, 
  Sparkles,
  Lock,
  Check,
  Puzzle
} from "lucide-react";
import { useModules, useWorkspaceModules, useModuleMutations, Module } from "@/hooks/useModules";
import { useWorkspaceSubscription } from "@/hooks/usePlans";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  FolderKanban,
  Users,
  CheckSquare,
  FileStack,
  FileText,
  Receipt,
  Gavel,
  HardHat,
  UserCog,
  Sparkles,
};

const CATEGORY_LABELS: Record<string, string> = {
  core: "Modules essentiels",
  finance: "Finance",
  business: "Métier",
  hr: "Ressources humaines",
  premium: "Premium",
};

const CATEGORY_ORDER = ["core", "finance", "business", "hr", "premium"];

export function ModulesSettings() {
  const { data: modules, isLoading: modulesLoading } = useModules();
  const { data: workspaceModules, isLoading: wmLoading } = useWorkspaceModules();
  const { data: subscription } = useWorkspaceSubscription();
  const { enableModule, disableModule } = useModuleMutations();
  const { isAdmin } = usePermissions();

  const isLoading = modulesLoading || wmLoading;

  const isModuleEnabled = (moduleId: string, isCore: boolean) => {
    if (isCore) return true;
    return workspaceModules?.some((wm) => wm.module_id === moduleId) ?? false;
  };

  const modulesByCategory = modules?.reduce((acc, module) => {
    const category = module.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const handleToggle = (module: Module, enabled: boolean) => {
    if (enabled) {
      enableModule.mutate(module.id);
    } else {
      disableModule.mutate(module.id);
    }
  };

  // Calculate total monthly cost for enabled modules
  const totalMonthlyCost = modules?.reduce((total, module) => {
    if (module.is_core) return total;
    if (isModuleEnabled(module.id, module.is_core)) {
      return total + module.price_monthly;
    }
    return total;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-40" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Puzzle className="h-5 w-5" />
          Modules & Extensions
        </h3>
        <p className="text-sm text-muted-foreground">
          Activez les modules dont vous avez besoin, facturés au prorata
        </p>
      </div>

      {/* Cost summary */}
      {totalMonthlyCost > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coût des modules additionnels</p>
                <p className="text-2xl font-bold">{totalMonthlyCost}€ <span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              </div>
              <Badge variant="secondary">
                Facturé au prorata
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules by category */}
      {CATEGORY_ORDER.map((category) => {
        const categoryModules = modulesByCategory?.[category];
        if (!categoryModules?.length) return null;

        return (
          <div key={category} className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[category] || category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryModules.map((module) => {
                const Icon = ICON_MAP[module.icon || ""] || Puzzle;
                const enabled = isModuleEnabled(module.id, module.is_core);
                const isPending = enableModule.isPending || disableModule.isPending;

                return (
                  <Card 
                    key={module.id}
                    className={cn(
                      "transition-all",
                      enabled && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            enabled 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{module.name}</CardTitle>
                            {module.is_core ? (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Inclus
                              </Badge>
                            ) : module.price_monthly > 0 ? (
                              <Badge variant="outline" className="text-xs mt-1">
                                +{module.price_monthly}€/mois
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Gratuit
                              </Badge>
                            )}
                          </div>
                        </div>
                        {module.is_core ? (
                          <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <PermissionGate permission="settings.edit" fallback={
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          }>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) => handleToggle(module, checked)}
                              disabled={isPending}
                            />
                          </PermissionGate>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {module.description}
                      </p>
                      {module.features && (module.features as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(module.features as string[]).slice(0, 3).map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {(module.features as string[]).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(module.features as string[]).length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
