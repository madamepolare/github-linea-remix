import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, useProjectMembersForList, Project, ProjectMember } from "@/hooks/useProjects";
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
  Settings
} from "lucide-react";
import { PROJECT_TYPES } from "@/lib/projectTypes";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

interface ProjectCardsViewProps {
  onCreateProject?: () => void;
}

type ViewFilter = "active" | "closed" | "archived";

export function ProjectCardsView({ onCreateProject }: ProjectCardsViewProps) {
  const navigate = useNavigate();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  
  const { projects: activeProjects, isLoading: loadingActive, deleteProject } = useProjects();
  const { projects: closedProjects, isLoading: loadingClosed } = useProjects({ includeClosed: true });
  const { projects: archivedProjects, isLoading: loadingArchived } = useProjects({ includeArchived: true });

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
  
  const projects = useMemo(() => {
    switch (viewFilter) {
      case "closed":
        return closedProjects.filter(p => p.status === "closed" && !p.is_archived);
      case "archived":
        return archivedProjects.filter(p => p.is_archived);
      default:
        return activeProjects;
    }
  }, [viewFilter, activeProjects, closedProjects, archivedProjects]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              members={projectMembersByProject[project.id] || []}
              index={index}
              onNavigate={() => navigate(`/projects/${project.id}`)}
              onDelete={() => setDeleteProjectId(project.id)}
              formatCurrency={formatCurrency}
            />
          ))}
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
  index: number;
  onNavigate: () => void;
  onDelete: () => void;
  formatCurrency: (value: number) => string;
}

function ProjectCard({ project, members, index, onNavigate, onDelete, formatCurrency }: ProjectCardProps) {
  const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
  const phases = project.phases || [];
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const currentPhase = phases.find((p) => p.status === "in_progress");
  const displayColor = projectType?.color || project.color || "#3B82F6";
  const isClosed = project.status === "closed";

  // Calculate days remaining
  const daysRemaining = project.end_date 
    ? differenceInDays(parseISO(project.end_date), new Date())
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className={cn(
          "group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4",
          isClosed && "opacity-70"
        )}
        style={{ borderLeftColor: displayColor }}
        onClick={onNavigate}
      >
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm line-clamp-1">{project.name}</h3>
                {isClosed && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {projectType && (
                  <Badge 
                    variant="secondary" 
                    className="text-2xs"
                    style={{ 
                      backgroundColor: `${displayColor}15`,
                      color: displayColor,
                    }}
                  >
                    {projectType.label}
                  </Badge>
                )}
                {project.is_internal && (
                  <Badge variant="outline" className="text-2xs">Interne</Badge>
                )}
              </div>
            </div>
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

          {/* Client & Location */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {project.crm_company && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{project.crm_company.name}</span>
              </div>
            )}
            {project.city && (
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{project.city}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="truncate">
                  {currentPhase ? currentPhase.name : "Aucune phase active"}
                </span>
              </div>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            {/* Budget */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                <Wallet className="h-3 w-3" />
                <span>Budget</span>
              </div>
              <p className="text-xs font-semibold">
                {project.budget ? formatCurrency(project.budget) : "-"}
              </p>
            </div>

            {/* Team */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                <Users className="h-3 w-3" />
                <span>Équipe</span>
              </div>
              <div className="flex justify-center">
                {members.length > 0 ? (
                  <ProjectMemberAvatars members={members} max={3} />
                ) : (
                  <p className="text-xs font-semibold">-</p>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                <Calendar className="h-3 w-3" />
                <span>Échéance</span>
              </div>
              {project.end_date ? (
                <p className={cn(
                  "text-xs font-semibold",
                  daysRemaining !== null && daysRemaining < 0 && "text-destructive",
                  daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 && "text-amber-500"
                )}>
                  {format(parseISO(project.end_date), "d MMM", { locale: fr })}
                </p>
              ) : (
                <p className="text-xs font-semibold">-</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
