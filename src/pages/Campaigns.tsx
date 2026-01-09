import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Megaphone, 
  MoreHorizontal,
  Calendar,
  Target,
  TrendingUp,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCampaigns, CAMPAIGN_STATUSES, useCampaignMutations } from "@/hooks/useCampaigns";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const { data: campaigns, isLoading } = useCampaigns();
  const { deleteCampaign } = useCampaignMutations();
  
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const getStatusConfig = (status: string) => {
    return CAMPAIGN_STATUSES.find(s => s.value === status) || CAMPAIGN_STATUSES[0];
  };
  
  // Stats
  const stats = {
    total: campaigns?.length || 0,
    live: campaigns?.filter(c => c.status === 'live').length || 0,
    production: campaigns?.filter(c => c.status === 'production').length || 0,
    budgetTotal: campaigns?.reduce((sum, c) => sum + (c.budget_total || 0), 0) || 0,
  };
  
  return (
    <>
      <SEOHead
        title="Campagnes | LINEA"
        description="Gérez vos campagnes de communication"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campagnes</h1>
            <p className="text-muted-foreground">
              Gérez vos campagnes de communication
            </p>
          </div>
          <Button onClick={() => navigate('/campaigns/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Campagnes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.live}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Target className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.production}</p>
                  <p className="text-xs text-muted-foreground">En production</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.budgetTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">Budget total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une campagne..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter ? getStatusConfig(statusFilter).label : 'Tous les statuts'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                Tous les statuts
              </DropdownMenuItem>
              {CAMPAIGN_STATUSES.map(status => (
                <DropdownMenuItem 
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                >
                  <div className={cn("w-2 h-2 rounded-full mr-2", status.color)} />
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Campaigns list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredCampaigns?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune campagne</h3>
              <p className="text-muted-foreground text-center mb-4">
                {search ? "Aucune campagne ne correspond à votre recherche" : "Créez votre première campagne pour commencer"}
              </p>
              {!search && (
                <Button onClick={() => navigate('/campaigns/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une campagne
                </Button>
              )}
            </CardContent>
          </Card>
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
    </>
  );
}
