import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const phases = [
  { id: "planning", label: "Planning", color: "bg-blue-500" },
  { id: "design", label: "Design", color: "bg-amber-500" },
  { id: "execution", label: "Execution", color: "bg-green-500" },
  { id: "review", label: "Review", color: "bg-purple-500" },
  { id: "completed", label: "Completed", color: "bg-muted" },
];

const mockProjects = [
  { id: "1", name: "Office Building Renovation", phase: "design", client: "Acme Corp", team: ["JD", "SM"] },
  { id: "2", name: "Residential Complex", phase: "planning", client: "BuildRight", team: ["PL", "MR"] },
  { id: "3", name: "Commercial Center", phase: "execution", client: "Metro Group", team: ["JD", "CL", "RM"] },
  { id: "4", name: "Hospital Wing Extension", phase: "review", client: "City Health", team: ["SM"] },
  { id: "5", name: "University Library", phase: "design", client: "State Uni", team: ["AK", "PL"] },
  { id: "6", name: "Shopping Mall", phase: "planning", client: "Retail Inc", team: ["MR", "JD"] },
];

export function ProjectBoard() {
  const getProjectsByPhase = (phaseId: string) => 
    mockProjects.filter(p => p.phase === phaseId);

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4 min-w-max">
        {phases.map((phase) => {
          const projects = getProjectsByPhase(phase.id);
          
          return (
            <div key={phase.id} className="w-72 flex-shrink-0">
              <div className="kanban-column">
                {/* Column Header */}
                <div className="kanban-column-header border-b border-border">
                  <div className={cn("w-2 h-2 rounded-full", phase.color)} />
                  <span className="text-sm font-medium">{phase.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {projects.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 flex-1">
                  {projects.map((project) => (
                    <Card key={project.id} className="task-card">
                      <CardContent className="p-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium leading-snug">{project.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-2xs">
                            {phase.label}
                          </Badge>
                          
                          <div className="flex -space-x-1">
                            {project.team.slice(0, 3).map((initials, i) => (
                              <div
                                key={i}
                                className="h-5 w-5 rounded-full bg-foreground text-background text-2xs font-medium flex items-center justify-center border border-background"
                              >
                                {initials}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {projects.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
