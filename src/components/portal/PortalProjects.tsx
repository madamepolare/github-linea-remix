import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderOpen, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  status: string;
  color: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  address?: string | null;
  city?: string | null;
  phases: Array<{
    id: string;
    name: string;
    status: string;
    sort_order: number;
  }>;
}

interface PortalProjectsProps {
  projects: Project[];
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  active: 'En cours',
  on_hold: 'En pause',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-primary/10 text-primary',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-destructive/10 text-destructive',
};

export function PortalProjects({ projects }: PortalProjectsProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun projet pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map(project => {
        const completedPhases = project.phases.filter(p => p.status === 'completed').length;
        const totalPhases = project.phases.length;
        const progress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

        return (
          <Card key={project.id} className="overflow-hidden">
            <div 
              className="h-1.5" 
              style={{ backgroundColor: project.color || 'hsl(var(--primary))' }}
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                <Badge className={statusColors[project.status] || 'bg-muted'}>
                  {statusLabels[project.status] || project.status}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dates */}
              {(project.start_date || project.end_date) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {project.start_date && format(new Date(project.start_date), 'MMM yyyy', { locale: fr })}
                    {project.start_date && project.end_date && ' → '}
                    {project.end_date && format(new Date(project.end_date), 'MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}

              {/* Location */}
              {(project.address || project.city) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{[project.address, project.city].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Phases progress */}
              {totalPhases > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avancement</span>
                    <span className="font-medium">{completedPhases}/{totalPhases} phases</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Phase badges */}
              {project.phases.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.phases
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .slice(0, 5)
                    .map(phase => (
                      <Badge 
                        key={phase.id} 
                        variant={phase.status === 'completed' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {phase.name}
                      </Badge>
                    ))}
                  {project.phases.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.phases.length - 5}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
