import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  CalendarDays, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaPlanItems, MEDIA_ITEM_STATUSES, useMediaPlanMutations } from "@/hooks/useMediaPlanning";
import { useCampaigns } from "@/hooks/useCampaigns";
import { MediaPlanItemSheet } from "@/components/media-planning/MediaPlanItemSheet";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { ModuleStatsGrid } from "@/components/shared/ModuleStatsGrid";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { ModuleEmptyState } from "@/components/shared/ModuleEmptyState";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function MediaPlanning() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const { data: mediaItems, isLoading } = useMediaPlanItems();
  const { data: campaigns } = useCampaigns();
  const { deleteMediaPlanItem } = useMediaPlanMutations();
  
  const filteredItems = mediaItems?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });
  
  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Group items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, typeof filteredItems> = {};
    filteredItems?.forEach(item => {
      const dateKey = item.publish_date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey]!.push(item);
    });
    return grouped;
  }, [filteredItems]);
  
  const getStatusConfig = (status: string) => {
    return MEDIA_ITEM_STATUSES.find(s => s.value === status) || MEDIA_ITEM_STATUSES[0];
  };
  
  // Stats
  const stats = [
    {
      label: "Total",
      value: mediaItems?.length || 0,
      icon: CalendarDays,
      iconColor: "primary" as const,
    },
    {
      label: "Ce mois-ci",
      value: mediaItems?.filter(item => {
        const itemDate = new Date(item.publish_date);
        return isSameMonth(itemDate, currentMonth);
      }).length || 0,
      icon: Clock,
      iconColor: "blue" as const,
    },
    {
      label: "Publiés",
      value: mediaItems?.filter(item => item.status === 'published').length || 0,
      icon: CheckCircle,
      iconColor: "green" as const,
    },
    {
      label: "Planifiés",
      value: mediaItems?.filter(item => item.status === 'planned').length || 0,
      icon: CalendarDays,
      iconColor: "amber" as const,
    },
  ];

  const selectedItem = mediaItems?.find(item => item.id === selectedItemId);
  const selectedCampaign = selectedItem ? campaigns?.find(c => c.id === selectedItem.campaign_id) : null;
  
  return (
    <>
      <SEOHead
        title="Planning Média | LINEA"
        description="Planifiez vos sorties médias"
      />
      
      <PageLayout title="Planning Média" hideHeader>
        <div className="space-y-6">
          {/* Header */}
          <ModuleHeader
            icon={CalendarDays}
            title="Planning Média"
            description="Planifiez et suivez vos publications"
            actions={
              <Button onClick={() => navigate('/media-planning/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle publication
              </Button>
            }
          />
          
          {/* Stats */}
          <ModuleStatsGrid stats={stats} />
          
          {/* Filters & View toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <ModuleFiltersBar
              search={{
                value: search,
                onChange: setSearch,
                placeholder: "Rechercher...",
              }}
              className="flex-1"
            />
            
            <div className="flex items-center gap-2">
              {/* Month navigation */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 font-medium text-sm min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('calendar')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Content */}
          {isLoading ? (
            <div className="grid gap-4 grid-cols-7">
              {[...Array(35)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : viewMode === 'calendar' ? (
            /* Calendar View */
            <Card>
              <CardContent className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Offset for first day of month */}
                  {[...Array((monthStart.getDay() + 6) % 7)].map((_, i) => (
                    <div key={`offset-${i}`} className="h-24 bg-muted/30 rounded-lg" />
                  ))}
                  
                  {calendarDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayItems = itemsByDate[dateKey] || [];
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          "h-24 p-1 rounded-lg border transition-colors overflow-hidden",
                          isCurrentDay ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "text-xs font-medium mb-1",
                          isCurrentDay ? "text-primary" : "text-muted-foreground"
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayItems.slice(0, 3).map(item => {
                            const status = getStatusConfig(item.status);
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer",
                                  status.color,
                                  "text-white"
                                )}
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                {item.title}
                              </div>
                            );
                          })}
                          {dayItems.length > 3 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              +{dayItems.length - 3} autres
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredItems?.length === 0 ? (
                <ModuleEmptyState
                  icon={CalendarDays}
                  title="Aucune publication"
                  description="Planifiez votre première publication"
                  actionLabel="Nouvelle publication"
                  onAction={() => navigate('/media-planning/new')}
                />
              ) : (
                filteredItems?.map(item => {
                  const status = getStatusConfig(item.status);
                  const campaign = campaigns?.find(c => c.id === item.campaign_id);
                  
                  return (
                    <Card 
                      key={item.id}
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="text-center min-w-[50px]">
                              <div className="text-lg font-bold">
                                {format(new Date(item.publish_date), 'd')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(item.publish_date), 'MMM', { locale: fr })}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{item.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {item.channel && (
                                  <span>{item.channel.name}</span>
                                )}
                                {campaign && (
                                  <>
                                    <span>•</span>
                                    <span>{campaign.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={cn("text-white", status.color)}>
                              {status.label}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemId(item.id);
                                }}>
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMediaPlanItem.mutate(item.id);
                                  }}
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </PageLayout>
      
      <MediaPlanItemSheet
        item={selectedItem ? { ...selectedItem, campaign: selectedCampaign ? { id: selectedCampaign.id, name: selectedCampaign.name } : null } : null}
        open={!!selectedItemId}
        onOpenChange={(open) => !open && setSelectedItemId(null)}
        onDelete={() => {
          if (selectedItemId) {
            deleteMediaPlanItem.mutate(selectedItemId);
            setSelectedItemId(null);
          }
        }}
      />
    </>
  );
}
