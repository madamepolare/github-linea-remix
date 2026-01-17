import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, useProjectMembersForList, Project, ProjectMember } from "@/hooks/useProjects";
import { useProjectsAlertsForList, ProjectFinancialData } from "@/hooks/useProjectsAlerts";
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Building2, 
  FolderKanban, 
  MapPin, 
  MoreHorizontal, 
  Archive, 
  Lock, 
  Trash2,
  Calendar,
  Wallet,
  Users,
  TrendingUp,
  Eye,
  Settings,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  Bell,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { PROJECT_TYPES } from "@/lib/projectTypes";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

// Get icon component from name
const getIconComponent = (iconName: string): React.ElementType => {
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  return icons[iconName] || FolderKanban;
};

// Avatar stack component for project members
function ProjectMemberAvatars({ members, max = 4 }: { 
  members: (ProjectMember & { profile: { user_id: string; full_name: string | null; avatar_url: string | null } | null })[];
  max?: number;
}) {
  if (!members || members.length === 0) return null;

  const displayMembers = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {displayMembers.map((member) => {
          const initials = member.profile?.full_name
            ? member.profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "?";
          return (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background ring-0">
                  <AvatarImage src={member.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-2xs bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{member.profile?.full_name || "Membre"}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {remaining > 0 && (
          <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-2xs font-medium">
            +{remaining}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface ProjectListViewProps {
  onCreateProject?: () => void;
}

type ViewFilter = "active" | "closed" | "archived";

type SortField = "name" | "progress" | "budget" | "endDate" | "client";
type SortDirection = "asc" | "desc";

export function ProjectListView({ onCreateProject }: ProjectListViewProps) {
  const navigate = useNavigate();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  const { projects: activeProjects, isLoading: loadingActive, deleteProject } = useProjects();
  const { projects: closedProjects, isLoading: loadingClosed } = useProjects({ includeClosed: true });
  const { projects: archivedProjects, isLoading: loadingArchived } = useProjects({ includeArchived: true });
  const { projectTypes } = useProjectTypeSettings();

  // Get all project IDs for fetching members
  const allProjectIds = useMemo(() => {
    const ids = new Set<string>();
    activeProjects.forEach(p => ids.add(p.id));
    closedProjects.forEach(p => ids.add(p.id));
    archivedProjects.forEach(p => ids.add(p.id));
    return [...ids];
  }, [activeProjects, closedProjects, archivedProjects]);

  // Fetch all project members at once
  const { data: projectMembersByProject = {} } = useProjectMembersForList(allProjectIds);
  
  // Fetch financial data and alerts for all projects
  const { data: projectsFinancialData = {} } = useProjectsAlertsForList(allProjectIds);
  
  const filteredProjects = useMemo(() => {
    switch (viewFilter) {
      case "closed":
        return closedProjects.filter(p => p.status === "closed" && !p.is_archived);
      case "archived":
        return archivedProjects.filter(p => p.is_archived);
      default:
        return activeProjects;
    }
  }, [viewFilter, activeProjects, closedProjects, archivedProjects]);

  // Sort projects
  const projects = useMemo(() => {
    const sorted = [...filteredProjects].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "progress":
          const aProgress = (a.phases?.filter(p => p.status === "completed").length || 0) / Math.max(a.phases?.length || 1, 1);
          const bProgress = (b.phases?.filter(p => p.status === "completed").length || 0) / Math.max(b.phases?.length || 1, 1);
          comparison = aProgress - bProgress;
          break;
        case "budget":
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        case "endDate":
          const aDate = a.end_date ? new Date(a.end_date).getTime() : 0;
          const bDate = b.end_date ? new Date(b.end_date).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case "client":
          comparison = (a.crm_company?.name || "").localeCompare(b.crm_company?.name || "");
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredProjects, sortField, sortDirection]);

  // Calculate financial totals
  const financialTotals = useMemo(() => {
    let totalBudget = 0;
    let totalConsomme = 0;
    
    projects.forEach(p => {
      if (p.budget) totalBudget += p.budget;
      const financial = projectsFinancialData[p.id];
      if (financial) {
        totalConsomme += financial.totalConsomme || 0;
      }
    });
    
    const margePercent = totalBudget > 0 ? ((totalBudget - totalConsomme) / totalBudget) * 100 : 0;
    
    return { totalBudget, totalConsomme, margePercent };
  }, [projects, projectsFinancialData]);

  const isLoading = viewFilter === "archived" ? loadingArchived : viewFilter === "closed" ? loadingClosed : loadingActive;

  const handleDelete = async () => {
    if (!deleteProjectId) return;
    await deleteProject.mutateAsync(deleteProjectId);
    setDeleteProjectId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-3 w-3 ml-1" /> 
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between overflow-x-auto">
        <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
          <TabsList className="h-9">
            <TabsTrigger value="active" className="text-xs sm:text-sm">Actifs ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="closed" className="text-xs sm:text-sm">Fermés ({closedProjects.filter(p => p.status === "closed" && !p.is_archived).length})</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs sm:text-sm hidden sm:flex">Archivés ({archivedProjects.filter(p => p.is_archived).length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center h-[400px]">
          <EmptyState
            icon={viewFilter === "archived" ? Archive : viewFilter === "closed" ? Lock : FolderKanban}
            title={viewFilter === "archived" ? "Aucun projet archivé" : viewFilter === "closed" ? "Aucun projet fermé" : "Aucun projet"}
            description={viewFilter === "archived" ? "Les projets archivés apparaîtront ici." : viewFilter === "closed" ? "Les projets fermés apparaîtront ici." : "Créez votre premier projet pour commencer."}
            action={viewFilter === "active" && onCreateProject ? { label: "Créer un projet", onClick: onCreateProject } : undefined}
          />
        </div>
      ) : (
        <div className="flex flex-col">
          {/* List Header */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-t-lg border-b text-xs font-medium text-muted-foreground">
            <div className="w-10 shrink-0" /> {/* Icon space */}
            <button 
              onClick={() => handleSort("name")}
              className="flex items-center w-48 sm:w-56 hover:text-foreground transition-colors"
            >
              Projet <SortIcon field="name" />
            </button>
            <button 
              onClick={() => handleSort("client")}
              className="hidden md:flex items-center w-48 hover:text-foreground transition-colors"
            >
              Client <SortIcon field="client" />
            </button>
            <button 
              onClick={() => handleSort("progress")}
              className="flex items-center w-24 hover:text-foreground transition-colors"
            >
              Avancement <SortIcon field="progress" />
            </button>
            <div className="flex-1 min-w-[140px]">Phase active</div>
            <div className="w-24 text-center">Santé</div>
            <div className="w-24">Équipe</div>
            <button 
              onClick={() => handleSort("budget")}
              className="flex items-center w-24 text-right justify-end hover:text-foreground transition-colors"
            >
              Budget <SortIcon field="budget" />
            </button>
            <button 
              onClick={() => handleSort("endDate")}
              className="flex items-center w-20 text-right justify-end hover:text-foreground transition-colors"
            >
              Échéance <SortIcon field="endDate" />
            </button>
            <div className="w-8" /> {/* Actions space */}
          </div>
          
          {/* Project rows */}
          <div className="flex flex-col gap-1">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                members={projectMembersByProject[project.id] || []}
                financialData={projectsFinancialData[project.id]}
                index={index}
                onNavigate={() => navigate(`/projects/${project.id}`)}
                onDelete={() => setDeleteProjectId(project.id)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Financial Totals Footer */}
          {financialTotals.totalBudget > 0 && (
            <div className="flex items-center justify-end gap-6 px-4 py-3 bg-muted/50 rounded-b-lg border-t mt-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Consommé : </span>
                <span className="font-semibold">{formatCurrency(financialTotals.totalConsomme)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Marge : </span>
                <span className={cn(
                  "font-semibold",
                  financialTotals.margePercent >= 20 && "text-emerald-600",
                  financialTotals.margePercent >= 0 && financialTotals.margePercent < 20 && "text-amber-600",
                  financialTotals.margePercent < 0 && "text-destructive"
                )}>
                  {Math.round(financialTotals.margePercent)}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Budget total : </span>
                <span className="font-bold text-primary">{formatCurrency(financialTotals.totalBudget)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  members: (ProjectMember & { profile: { user_id: string; full_name: string | null; avatar_url: string | null } | null })[];
  financialData?: ProjectFinancialData;
  index: number;
  onNavigate: () => void;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
}

function ProjectCard({ project, members, financialData, index, onNavigate, onDelete, formatCurrency }: ProjectCardProps) {
  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
  const phases = project.phases || [];
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const currentPhase = phases.find((p) => p.status === "in_progress");
  const displayColor = projectType?.color || project.color || "#3B82F6";
  const isClosed = project.status === "closed";

  // Get project type icon
  const TypeIcon = projectType?.icon ? getIconComponent(projectType.icon) : FolderKanban;

  // Calculate days remaining
  const daysRemaining = project.end_date 
    ? differenceInDays(parseISO(project.end_date), new Date())
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card 
        className={cn(
          "group cursor-pointer hover:shadow-md transition-all duration-200",
          isClosed && "opacity-70"
        )}
        onClick={onNavigate}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Project Type Icon */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${displayColor}15` }}
            >
              <TypeIcon className="h-5 w-5" style={{ color: displayColor }} />
            </div>

            {/* Left: Project info */}
            <div className="flex-1 min-w-0 flex items-center gap-4">
              {/* Name & Type */}
              <div className="min-w-0 w-48 sm:w-56 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                  {isClosed && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {projectType && (
                    <span className="text-xs text-muted-foreground">{projectType.label}</span>
                  )}
                  {project.is_internal && (
                    <Badge variant="outline" className="text-2xs">Interne</Badge>
                  )}
                </div>
              </div>

              {/* Client */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 w-48 shrink-0">
                {project.crm_company ? (
                  <>
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{project.crm_company.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>

              {/* Progress Circle */}
              <div className="hidden lg:flex items-center gap-2 w-24 shrink-0">
                <div className="relative h-6 w-6">
                  <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted-foreground/30"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke={displayColor}
                      strokeWidth="3"
                      strokeDasharray={`${progressPercent * 0.628} 62.8`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold">{progressPercent}%</span>
              </div>

              {/* Current Phase */}
              <div className="hidden xl:flex items-center min-w-[140px] flex-1">
                {currentPhase ? (
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-medium"
                    style={{ 
                      backgroundColor: currentPhase.color ? `${currentPhase.color}20` : undefined,
                      color: currentPhase.color || undefined
                    }}
                  >
                    {currentPhase.name}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
              {/* Profitability Icon */}
              {financialData && project.budget && project.budget > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center">
                        {financialData.margePercent >= 20 ? (
                          <Smile className="h-5 w-5 text-emerald-500" />
                        ) : financialData.margePercent >= 0 ? (
                          <Meh className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Frown className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Marge: {Math.round(financialData.margePercent)}%</p>
                      <p className="text-xs text-muted-foreground">
                        Consommé: {formatCurrency(financialData.totalConsomme)} / {formatCurrency(financialData.budget)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Alerts */}
              {financialData && financialData.alerts.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        {financialData.alerts.some(a => a.type === 'error') ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : financialData.alerts.some(a => a.type === 'warning') ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Bell className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-xs font-medium">
                          {financialData.alerts.length}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        {financialData.alerts.slice(0, 4).map((alert, idx) => (
                          <div key={idx} className={cn(
                            "text-xs flex items-center gap-1.5",
                            alert.type === 'error' && "text-destructive",
                            alert.type === 'warning' && "text-amber-600",
                            alert.type === 'info' && "text-primary"
                          )}>
                            <span>•</span>
                            <span>{alert.message}</span>
                          </div>
                        ))}
                        {financialData.alerts.length > 4 && (
                          <p className="text-xs text-muted-foreground">
                            +{financialData.alerts.length - 4} autres
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Team */}
              <div className="hidden sm:block">
                {members.length > 0 ? (
                  <ProjectMemberAvatars members={members} max={4} />
                ) : (
                  <div className="text-xs text-muted-foreground">—</div>
                )}
              </div>

              {/* Budget */}
              <div className="hidden sm:block text-right w-20">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-xs font-semibold">
                  {project.budget ? formatCurrency(project.budget) : "—"}
                </p>
              </div>

              {/* Deadline */}
              <div className="text-right w-16">
                <p className="text-xs text-muted-foreground">Échéance</p>
                {project.end_date ? (
                  <p className={cn(
                    "text-xs font-semibold",
                    daysRemaining !== null && daysRemaining < 0 && "text-destructive",
                    daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 && "text-amber-500"
                  )}>
                    {format(parseISO(project.end_date), "d MMM", { locale: fr })}
                  </p>
                ) : (
                  <p className="text-xs font-semibold">—</p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={onNavigate}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir le projet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/projects/${project.id}/settings`; }}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
