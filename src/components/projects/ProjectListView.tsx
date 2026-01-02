import { useNavigate } from "react-router-dom";
import { useProjects, Project } from "@/hooks/useProjects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, FolderKanban, MapPin } from "lucide-react";
import { PROJECT_TYPES, PHASE_STATUS_CONFIG } from "@/lib/projectTypes";

interface ProjectListViewProps {
  onCreateProject?: () => void;
}

export function ProjectListView({ onCreateProject }: ProjectListViewProps) {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour commencer."
          action={onCreateProject ? { label: "Créer un projet", onClick: onCreateProject } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
