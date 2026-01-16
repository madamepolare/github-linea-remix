import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, useSubProjects, useProjectMembersForList, Project, ProjectMember } from "@/hooks/useProjects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, FolderKanban, MapPin, MoreHorizontal, Archive, ArchiveRestore, Trash2, ChevronRight, Lock, Unlock, FolderOpen, CornerDownRight } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/projectTypes";
import { cn } from "@/lib/utils";

// Avatar stack component for project members
function ProjectMemberAvatars({ members }: { members: (ProjectMember & { profile: { user_id: string; full_name: string | null; avatar_url: string | null } | null })[] }) {
  if (!members || members.length === 0) return null;

  const displayMembers = members.slice(0, 3);
  const remaining = members.length - 3;

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
                <Avatar className="h-6 w-6 border-2 border-background ring-0">
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
          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-2xs font-medium">
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

// Sub-projects row component
function SubProjectsRows({ parentId, onNavigate, onDelete, membersByProject }: { 
  parentId: string; 
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  membersByProject: Record<string, (ProjectMember & { profile: { user_id: string; full_name: string | null; avatar_url: string | null } | null })[]>;
}) {
  const { data: subProjects = [], isLoading } = useSubProjects(parentId);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="py-2 pl-12">
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (subProjects.length === 0) return null;

  return (
    <>
      {subProjects.map((project) => {
        const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
        const phases = project.phases || [];
        const completedPhases = phases.filter((p) => p.status === "completed").length;
        const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
        const currentPhase = phases.find((p) => p.status === "in_progress");
        const isClosed = project.status === "closed";

        return (
          <TableRow
            key={project.id}
            className={cn(
              "cursor-pointer hover:bg-muted/50 bg-muted/20",
              isClosed && "opacity-60"
            )}
            onClick={() => onNavigate(project.id)}
          >
            <TableCell>
              <div className="flex items-center gap-3 pl-6">
                <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                <div
                  className="w-1 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color || "#3B82F6" }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{project.name}</p>
                    {isClosed && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  {project.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.city}
                    </p>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {projectType && (
                  <Badge variant="secondary" className="text-xs">{projectType.label}</Badge>
                )}
                <ProjectMemberAvatars members={membersByProject[project.id] || []} />
              </div>
            </TableCell>
            <TableCell>
              {project.crm_company ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {project.crm_company.name}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              {currentPhase ? (
                <span className="text-sm">{currentPhase.name}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 min-w-24">
                <Progress value={progressPercent} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
              </div>
            </TableCell>
            <TableCell>
              {project.start_date ? (
                <span className="text-sm">
                  {format(parseISO(project.start_date), "d MMM yyyy", { locale: fr })}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {project.budget ? (
                <span className="text-sm font-medium">
                  {project.budget.toLocaleString("fr-FR")} €
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(project.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export function ProjectListView({ onCreateProject }: ProjectListViewProps) {
  const navigate = useNavigate();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  const { projects: activeProjects, isLoading: loadingActive, archiveProject, closeProject, deleteProject } = useProjects();
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

  // Count sub-projects for each parent
  const projectsWithSubCount = useMemo(() => {
    // We need to check which projects have sub-projects
    // For now we'll use contract_type === 'framework' as indicator
    return activeProjects;
  }, [activeProjects]);
  
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

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteProjectId) return;
    await deleteProject.mutateAsync(deleteProjectId);
    setDeleteProjectId(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
          <TabsList>
            <TabsTrigger value="active">Actifs ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="closed">Fermés ({closedProjects.filter(p => p.status === "closed" && !p.is_archived).length})</TabsTrigger>
            <TabsTrigger value="archived">Archivés ({archivedProjects.filter(p => p.is_archived).length})</TabsTrigger>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Projet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Avancement</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
              const phases = project.phases || [];
              const completedPhases = phases.filter((p) => p.status === "completed").length;
              const progressPercent = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
              const currentPhase = phases.find((p) => p.status === "in_progress");
              const hasSubProjects = (project as any).contract_type === "framework";
              const isExpanded = expandedProjects.has(project.id);
              const isClosed = project.status === "closed";

              return (
                <>
                  <TableRow
                    key={project.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      isClosed && "opacity-70"
                    )}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {hasSubProjects && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(project.id);
                            }}
                          >
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          </Button>
                        )}
                        <div
                          className="w-1.5 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || "#3B82F6" }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{project.name}</p>
                            {hasSubProjects && (
                              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            {isClosed && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          {project.city && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {projectType && (
                          <Badge variant="secondary">{projectType.label}</Badge>
                        )}
                        <ProjectMemberAvatars members={projectMembersByProject[project.id] || []} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.crm_company ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {project.crm_company.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentPhase ? (
                        <span className="text-sm">{currentPhase.name}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-24">
                        <Progress value={progressPercent} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.start_date ? (
                        <span className="text-sm">
                          {format(parseISO(project.start_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {project.budget ? (
                        <span className="text-sm font-medium">
                          {project.budget.toLocaleString("fr-FR")} €
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {/* Close/Reopen */}
                          {!project.is_archived && (
                            isClosed ? (
                              <DropdownMenuItem onClick={() => closeProject.mutate({ id: project.id, isClosed: false })}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Réouvrir
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => closeProject.mutate({ id: project.id, isClosed: true })}>
                                <Lock className="h-4 w-4 mr-2" />
                                Fermer
                              </DropdownMenuItem>
                            )
                          )}
                          {/* Archive/Restore */}
                          {project.is_archived ? (
                            <DropdownMenuItem onClick={() => archiveProject.mutate({ id: project.id, isArchived: false })}>
                              <ArchiveRestore className="h-4 w-4 mr-2" />
                              Restaurer
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => archiveProject.mutate({ id: project.id, isArchived: true })}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteProjectId(project.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {/* Sub-projects */}
                  {hasSubProjects && isExpanded && (
                    <SubProjectsRows 
                      parentId={project.id} 
                      onNavigate={(id) => navigate(`/projects/${id}`)}
                      onDelete={setDeleteProjectId}
                      membersByProject={projectMembersByProject}
                    />
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet et toutes ses données seront définitivement supprimés.
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