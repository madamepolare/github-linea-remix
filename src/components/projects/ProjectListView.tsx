import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, Project } from "@/hooks/useProjects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
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
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, FolderKanban, MapPin, MoreHorizontal, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/projectTypes";

interface ProjectListViewProps {
  onCreateProject?: () => void;
}

export function ProjectListView({ onCreateProject }: ProjectListViewProps) {
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  
  const { projects: activeProjects, isLoading: loadingActive, archiveProject, deleteProject } = useProjects();
  const { projects: archivedProjects, isLoading: loadingArchived } = useProjects({ includeArchived: true });
  
  const projects = showArchived 
    ? archivedProjects.filter(p => p.is_archived) 
    : activeProjects;
  const isLoading = showArchived ? loadingArchived : loadingActive;

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
        <Tabs value={showArchived ? "archived" : "active"} onValueChange={(v) => setShowArchived(v === "archived")}>
          <TabsList>
            <TabsTrigger value="active">Actifs ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivés ({archivedProjects.filter(p => p.is_archived).length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center h-[400px]">
          <EmptyState
            icon={showArchived ? Archive : FolderKanban}
            title={showArchived ? "Aucun projet archivé" : "Aucun projet"}
            description={showArchived ? "Les projets archivés apparaîtront ici." : "Créez votre premier projet pour commencer."}
            action={!showArchived && onCreateProject ? { label: "Créer un projet", onClick: onCreateProject } : undefined}
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

              return (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || "#3B82F6" }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{project.name}</p>
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
                    {projectType && (
                      <Badge variant="secondary">{projectType.label}</Badge>
                    )}
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