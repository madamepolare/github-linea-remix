import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  Target,
  BarChart3,
  FileText,
  Play,
  Settings,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCampaign, useCampaignMutations, CAMPAIGN_STATUSES } from "@/hooks/useCampaigns";
import { useMediaPlanItems } from "@/hooks/useMediaPlanning";
import { CampaignDialog } from "@/components/campaigns/CampaignDialog";
import { ModuleEmptyState } from "@/components/shared/ModuleEmptyState";
import { SEOHead } from "@/components/seo/SEOHead";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: campaign, isLoading } = useCampaign(id);
  const { data: mediaItems = [] } = useMediaPlanItems(id);
  const { deleteCampaign } = useCampaignMutations();

  const statusConfig = CAMPAIGN_STATUSES.find((s) => s.value === campaign?.status);

  const handleDelete = () => {
    if (id && confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) {
      deleteCampaign.mutate(id, {
        onSuccess: () => navigate("/campaigns"),
      });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "–";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: campaign?.currency || "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const budgetProgress = campaign?.budget_total
    ? ((campaign.budget_spent || 0) / campaign.budget_total) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <ModuleEmptyState
          icon={Megaphone}
          title="Campagne introuvable"
          description="Cette campagne n'existe pas ou a été supprimée"
          actionLabel="Retour aux campagnes"
          onAction={() => navigate("/campaigns")}
        />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${campaign.name} | Campagne`}
        description={campaign.description || "Détails de la campagne"}
      />

      <div className="flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 border-b bg-background"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/campaigns")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: campaign.color || "hsl(var(--primary))" }}
              >
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{campaign.name}</h1>
                  {statusConfig && (
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {campaign.client?.name && <span>{campaign.client.name}</span>}
                  {campaign.start_date && campaign.end_date && (
                    <>
                      <span>•</span>
                      <span>
                        {format(new Date(campaign.start_date), "dd MMM", { locale: fr })} -{" "}
                        {format(new Date(campaign.end_date), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <Target className="h-4 w-4" />
                Aperçu
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <Calendar className="h-4 w-4" />
                Planning Média
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="gap-2">
                <FileText className="h-4 w-4" />
                Livrables
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          {formatCurrency(campaign.budget_spent || 0)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {formatCurrency(campaign.budget_total)}
                        </span>
                      </div>
                      <Progress value={budgetProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(budgetProgress)}% du budget utilisé
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Période
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Début :{" "}
                          {campaign.start_date
                            ? format(new Date(campaign.start_date), "dd MMMM yyyy", { locale: fr })
                            : "Non défini"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Fin :{" "}
                          {campaign.end_date
                            ? format(new Date(campaign.end_date), "dd MMMM yyyy", { locale: fr })
                            : "Non défini"}
                        </span>
                      </div>
                      {campaign.launch_date && (
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            Lancement :{" "}
                            {format(new Date(campaign.launch_date), "dd MMMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Media Items Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Publications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{mediaItems.length}</span>
                      <span className="text-sm text-muted-foreground">publications planifiées</span>
                    </div>
                    <Button
                      variant="link"
                      className="px-0 mt-2"
                      onClick={() => navigate("/media-planning")}
                    >
                      Voir le planning média
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Brief Section */}
              {campaign.brief_content && (
                <Card>
                  <CardHeader>
                    <CardTitle>Brief de campagne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap">{campaign.brief_content}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Objectives */}
              {campaign.objectives && campaign.objectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Objectifs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {campaign.objectives.map((objective, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media">
              {mediaItems.length === 0 ? (
                <ModuleEmptyState
                  icon={Calendar}
                  title="Aucune publication"
                  description="Ajoutez des publications au planning média de cette campagne"
                  actionLabel="Aller au planning média"
                  onAction={() => navigate("/media-planning")}
                />
              ) : (
                <div className="space-y-3">
                  {mediaItems.map((item) => (
                    <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.channel?.channel_type} • {item.format}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(item.publish_date), "dd MMM yyyy", { locale: fr })}
                          </p>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Deliverables Tab */}
            <TabsContent value="deliverables">
              <ModuleEmptyState
                icon={FileText}
                title="Aucun livrable"
                description="Les livrables de cette campagne apparaîtront ici"
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <ModuleEmptyState
                icon={BarChart3}
                title="Aucune donnée"
                description="Les KPIs et analytics seront disponibles une fois la campagne lancée"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CampaignDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        campaign={campaign}
      />
    </>
  );
}
