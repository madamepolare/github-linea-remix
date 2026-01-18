import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Crown, 
  Check, 
  Zap, 
  Users, 
  FolderKanban, 
  HardDrive,
  CreditCard,
  ArrowRight,
  Sparkles,
  Bot,
  Activity,
  TrendingUp
} from "lucide-react";
import { usePlans, useWorkspaceSubscription, useSubscriptionMutations, Plan } from "@/hooks/usePlans";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaceUsage } from "@/hooks/useWorkspaceUsage";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { cn } from "@/lib/utils";

export function PlanSettings() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subLoading } = useWorkspaceSubscription();
  const { subscribeToPlan } = useSubscriptionMutations();
  const { isOwner } = usePermissions();
  const { usageStats, isLoading: usageLoading } = useWorkspaceUsage();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const currentPlan = subscription?.plan || plans?.find(p => p.slug === "free");
  const isLoading = plansLoading || subLoading;

  // Mock usage data (would come from actual tracking)
  const usage = {
    users: 2,
    projects: 3,
    storage: 0.5,
  };

  const getUsagePercent = (current: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const formatServiceName = (name: string) => {
    const labels: Record<string, string> = {
      "ai-planning": "Planification IA",
      "contact-import": "Import contacts",
      "email-send": "Envoi emails",
      "ai-chat": "Chat IA",
      "ai-suggestions": "Suggestions IA",
      "document-generation": "Génération documents",
    };
    return labels[name] || name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Abonnement & Facturation</h3>
        <p className="text-sm text-muted-foreground">
          Gérez votre plan et suivez votre utilisation
        </p>
      </div>

      {/* Current plan overview */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Plan {currentPlan?.name}</CardTitle>
                <CardDescription>
                  {subscription?.status === "active" ? "Actif" : "Gratuit"}
                  {subscription?.billing_period && ` • Facturation ${subscription.billing_period === "yearly" ? "annuelle" : "mensuelle"}`}
                </CardDescription>
              </div>
            </div>
            <Badge variant={currentPlan?.slug === "free" ? "secondary" : "default"}>
              {currentPlan?.slug === "free" ? "Gratuit" : `${currentPlan?.price_monthly}€/mois`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Utilisateurs
                </span>
                <span>
                  {usage.users} / {currentPlan?.max_users === -1 ? "∞" : currentPlan?.max_users}
                </span>
              </div>
              <Progress value={getUsagePercent(usage.users, currentPlan?.max_users || 1)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  Projets
                </span>
                <span>
                  {usage.projects} / {currentPlan?.max_projects === -1 ? "∞" : currentPlan?.max_projects}
                </span>
              </div>
              <Progress value={getUsagePercent(usage.projects, currentPlan?.max_projects || 1)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Stockage
                </span>
                <span>
                  {usage.storage} Go / {currentPlan?.max_storage_gb === -1 ? "∞" : currentPlan?.max_storage_gb} Go
                </span>
              </div>
              <Progress value={getUsagePercent(usage.storage, currentPlan?.max_storage_gb || 1)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI & API Usage Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Usage des extensions</CardTitle>
                <CardDescription>
                  {usageStats?.current_month || "Ce mois"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {usageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Sparkles className="h-4 w-4" />
                    Appels IA
                  </div>
                  <div className="text-2xl font-bold">
                    {usageStats?.ai_credits.total_calls || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-info/5 border border-info/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Tokens utilisés
                  </div>
                  <div className="text-2xl font-bold">
                    {(usageStats?.ai_credits.total_tokens || 0).toLocaleString("fr-FR")}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    Appels API
                  </div>
                  <div className="text-2xl font-bold">
                    {usageStats?.api_calls.total_calls || 0}
                  </div>
                </div>
              </div>

              {/* Detailed breakdown by service */}
              {usageStats && Object.keys(usageStats.ai_credits.by_service).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Détail par service IA</h4>
                  <div className="space-y-2">
                    {Object.entries(usageStats.ai_credits.by_service).map(([service, data]) => (
                      <div key={service} className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/50">
                        <span className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" />
                          {formatServiceName(service)}
                        </span>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{data.calls} appels</span>
                          <span>{data.tokens.toLocaleString("fr-FR")} tokens</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usageStats && Object.keys(usageStats.api_calls.by_service).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Détail par API</h4>
                  <div className="space-y-2">
                    {Object.entries(usageStats.api_calls.by_service).map(([service, calls]) => (
                      <div key={service} className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/50">
                        <span className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-info" />
                          {formatServiceName(service)}
                        </span>
                        <span className="text-muted-foreground">{calls} appels</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!usageStats || 
                (Object.keys(usageStats.ai_credits.by_service).length === 0 && 
                 Object.keys(usageStats.api_calls.by_service).length === 0)) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune utilisation ce mois-ci</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={cn("text-sm", billingPeriod === "monthly" && "font-semibold")}>
          Mensuel
        </span>
        <Switch
          checked={billingPeriod === "yearly"}
          onCheckedChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
        />
        <span className={cn("text-sm", billingPeriod === "yearly" && "font-semibold")}>
          Annuel
          <Badge variant="secondary" className="ml-2 text-xs">-17%</Badge>
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans?.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id;
          const price = billingPeriod === "yearly" ? plan.price_yearly / 12 : plan.price_monthly;
          const isPopular = plan.slug === "pro";

          return (
            <Card 
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all",
                isCurrentPlan && "border-primary ring-2 ring-primary/20",
                isPopular && !isCurrentPlan && "border-primary/50"
              )}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                  Populaire
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  {plan.price_monthly > 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{Math.round(price)}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                  ) : plan.slug === "enterprise" ? (
                    <span className="text-2xl font-bold">Sur devis</span>
                  ) : (
                    <span className="text-3xl font-bold">Gratuit</span>
                  )}
                  {billingPeriod === "yearly" && plan.price_yearly > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturé {plan.price_yearly}€/an
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.max_users === -1 ? "Utilisateurs illimités" : `${plan.max_users} utilisateurs`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.max_projects === -1 ? "Projets illimités" : `${plan.max_projects} projets`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.max_storage_gb === -1 ? "Stockage illimité" : `${plan.max_storage_gb} Go stockage`}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {(plan.features as string[])?.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <PermissionGate permission="settings.manage_billing">
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plan actuel
                    </Button>
                  ) : plan.slug === "enterprise" ? (
                    <Button variant="outline" className="w-full">
                      Nous contacter
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => subscribeToPlan.mutate({ 
                        planId: plan.id, 
                        billingPeriod 
                      })}
                      disabled={subscribeToPlan.isPending}
                    >
                      {plan.price_monthly > (currentPlan?.price_monthly || 0) ? (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Passer au {plan.name}
                        </>
                      ) : (
                        "Changer de plan"
                      )}
                    </Button>
                  )}
                </PermissionGate>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment method */}
      <PermissionGate permission="settings.manage_billing">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Moyen de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Aucun moyen de paiement configuré
              </p>
              <Button variant="outline" size="sm">
                Ajouter une carte
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}
