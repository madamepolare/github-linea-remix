import { useState, useMemo } from "react";
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
  CalendarDays, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaPlanItems, MEDIA_ITEM_STATUSES, useMediaPlanMutations } from "@/hooks/useMediaPlanning";
import { useCampaigns } from "@/hooks/useCampaigns";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function MediaPlanning() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
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
  const stats = {
    total: mediaItems?.length || 0,
    thisMonth: mediaItems?.filter(item => {
      const itemDate = new Date(item.publish_date);
      return isSameMonth(itemDate, currentMonth);
    }).length || 0,
    published: mediaItems?.filter(item => item.status === 'published').length || 0,
    planned: mediaItems?.filter(item => item.status === 'planned').length || 0,
  };
  
  return (
    <>
      <SEOHead
        title="Planning Média | LINEA"
        description="Planifiez vos sorties médias"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planning Média</h1>
            <p className="text-muted-foreground">
              Planifiez et suivez vos publications
            </p>
          </div>
          <Button onClick={() => navigate('/media-planning/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle publication
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Publiés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.planned}</p>
                <p className="text-xs text-muted-foreground">Planifiés</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters & View toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
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
                              onClick={() => navigate(`/media-planning/${item.id}`)}
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune publication</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Planifiez votre première publication
                  </p>
                  <Button onClick={() => navigate('/media-planning/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle publication
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredItems?.map(item => {
                const status = getStatusConfig(item.status);
                const campaign = campaigns?.find(c => c.id === item.campaign_id);
                
                return (
                  <Card 
                    key={item.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/media-planning/${item.id}`)}
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
                                navigate(`/media-planning/${item.id}`);
                              }}>
                                Modifier
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
    </>
  );
}
