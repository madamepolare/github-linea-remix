import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  is_billable: boolean;
  project: { id: string; name: string; color: string | null } | null;
  task: { id: string; title: string } | null;
}

interface PortalTimeEntriesProps {
  timeEntries: TimeEntry[];
  summary?: {
    total_hours: number;
    billable_hours: number;
  };
}

export function PortalTimeEntries({ timeEntries, summary }: PortalTimeEntriesProps) {
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  // Group by project
  const byProject = timeEntries.reduce((acc, entry) => {
    const projectId = entry.project?.id || 'no-project';
    const projectName = entry.project?.name || 'Sans projet';
    if (!acc[projectId]) {
      acc[projectId] = {
        name: projectName,
        color: entry.project?.color,
        entries: [],
        totalHours: 0,
        billableHours: 0,
      };
    }
    acc[projectId].entries.push(entry);
    acc[projectId].totalHours += entry.hours;
    if (entry.is_billable) {
      acc[projectId].billableHours += entry.hours;
    }
    return acc;
  }, {} as Record<string, { name: string; color: string | null; entries: TimeEntry[]; totalHours: number; billableHours: number }>);

  if (timeEntries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun temps enregistré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <p className="text-sm">Total heures</p>
              </div>
              <p className="text-2xl font-semibold">{formatHours(summary.total_hours)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm">Heures facturables</p>
              </div>
              <p className="text-2xl font-semibold text-emerald-600">
                {formatHours(summary.billable_hours)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <p className="text-sm">Entrées</p>
              </div>
              <p className="text-2xl font-semibold">{timeEntries.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grouped by project */}
      <div className="space-y-6">
        {Object.entries(byProject).map(([projectId, projectData]) => (
          <Card key={projectId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: projectData.color || 'hsl(var(--primary))' }}
                  />
                  <CardTitle className="text-lg">{projectData.name}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatHours(projectData.totalHours)}</p>
                  {projectData.billableHours > 0 && projectData.billableHours !== projectData.totalHours && (
                    <p className="text-xs text-muted-foreground">
                      {formatHours(projectData.billableHours)} facturables
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projectData.entries.slice(0, 10).map(entry => (
                  <div 
                    key={entry.id}
                    className="flex items-start justify-between gap-3 py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), 'dd MMM', { locale: fr })}
                        </span>
                        {entry.task && (
                          <span className="text-sm font-medium truncate">
                            {entry.task.title}
                          </span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.is_billable && (
                        <Badge variant="outline" className="text-xs">
                          Facturable
                        </Badge>
                      )}
                      <span className="font-medium text-sm w-12 text-right">
                        {formatHours(entry.hours)}
                      </span>
                    </div>
                  </div>
                ))}
                {projectData.entries.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    +{projectData.entries.length - 10} autres entrées
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
