import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Megaphone, 
  MoreHorizontal,
  Calendar,
  Target,
  TrendingUp,
  Filter,
  Euro,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCampaigns, CAMPAIGN_STATUSES, useCampaignMutations } from "@/hooks/useCampaigns";
import { CampaignDialog } from "@/components/campaigns/CampaignDialog";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { ModuleStatsGrid } from "@/components/shared/ModuleStatsGrid";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { ModuleEmptyState } from "@/components/shared/ModuleEmptyState";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: campaigns, isLoading } = useCampaigns();
  const { deleteCampaign } = useCampaignMutations();
  
  // Listen for command palette event
  useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener("open-create-campaign", handleOpen);
    return () => window.removeEventListener("open-create-campaign", handleOpen);
  }, []);
  
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const getStatusConfig = (status: string) => {
    return CAMPAIGN_STATUSES.find(s => s.value === status) || CAMPAIGN_STATUSES[0];
  };
  
  // Stats
  const stats = [
    {
      label: "Campagnes",
      value: campaigns?.length || 0,
      icon: Megaphone,
      iconColor: "primary" as const,
    },
    {
      label: "En cours",
      value: campaigns?.filter(c => c.status === 'live').length || 0,
      icon: TrendingUp,
      iconColor: "green" as const,
    },
    {
      label: "En production",
      value: campaigns?.filter(c => c.status === 'production').length || 0,
      icon: Target,
      iconColor: "amber" as const,
    },
    {
      label: "Budget total",
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
        campaigns?.reduce((sum, c) => sum + (c.budget_total || 0), 0) || 0
      ),
      icon: Euro,
      iconColor: "purple" as const,
    },
  ];
  
  return (
    <>
      <SEOHead
        title="Campagnes | LINEA"
        description="Gérez vos campagnes de communication"
      />
      
      <PageLayout title="Campagnes" hideHeader>
        <div className="space-y-6">
          {/* Header */}
          <ModuleHeader
            icon={Megaphone}
            title="Campagnes"
            description="Gérez vos campagnes de communication"
            actions={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle campagne
              </Button>
            }
          />
          
          {/* Stats */}
          <ModuleStatsGrid stats={stats} />
          
          {/* Filters */}
          <ModuleFiltersBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Rechercher une campagne...",
            }}
            filters={
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {CAMPAIGN_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", status.color)} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          
          {/* Campaigns list */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredCampaigns?.length === 0 ? (
            <ModuleEmptyState
              icon={Megaphone}
              title="Aucune campagne"
              description={search ? "Aucune campagne ne correspond à votre recherche" : "Créez votre première campagne pour commencer"}
              actionLabel={!search ? "Créer une campagne" : undefined}
              onAction={!search ? () => setDialogOpen(true) : undefined}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns?.map(campaign => {
                const statusConfig = getStatusConfig(campaign.status);
                return (
                  <Card 
                    key={campaign.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-1">
                            {campaign.name}
                          </CardTitle>
                          {campaign.client && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {campaign.client.name}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/campaigns/${campaign.id}`);
                            }}>
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCampaign.mutate(campaign.id);
                              }}
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {campaign.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary"
                            className={cn("text-white", statusConfig.color)}
                          >
                            {statusConfig.label}
                          </Badge>
                          
                          {campaign.budget_total && (
                            <span className="text-sm font-medium">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: campaign.currency || 'EUR' }).format(campaign.budget_total)}
                            </span>
                          )}
                        </div>
                        
                        {(campaign.start_date || campaign.end_date) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {campaign.start_date && format(new Date(campaign.start_date), 'dd MMM', { locale: fr })}
                            {campaign.start_date && campaign.end_date && ' → '}
                            {campaign.end_date && format(new Date(campaign.end_date), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageLayout>
      
      <CampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
