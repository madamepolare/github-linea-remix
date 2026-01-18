import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useMyProjects } from "@/hooks/useMyProjects";
import { FolderKanban, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  lead: "Prospect",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  in_progress: "En cours",
  on_hold: "En pause",
  completed: "Terminé",
  cancelled: "Annulé",
};

const statusColors: Record<string, string> = {
  lead: "bg-gray-100 text-gray-800",
  proposal: "bg-blue-100 text-blue-800",
  negotiation: "bg-yellow-100 text-yellow-800",
  won: "bg-green-100 text-green-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  on_hold: "bg-orange-100 text-orange-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export function MyProjectsTab() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useMyProjects();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Aucun projet"
        description="Vous n'êtes assigné à aucun projet pour le moment."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: project.color || "#6366f1" }}
                />
                <h3 className="font-medium truncate">{project.name}</h3>
              </div>
              <Badge className={statusColors[project.status] || "bg-gray-100"}>
                {statusLabels[project.status] || project.status}
              </Badge>
            </div>
            
            {project.client_company?.name && (
              <p className="text-sm text-muted-foreground mt-2 truncate">
                {project.client_company.name}
              </p>
            )}

            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              {project.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(project.start_date), "d MMM yyyy", { locale: fr })}
                </div>
              )}
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
