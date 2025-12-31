import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, addMonths, subMonths, differenceInDays, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useProjects, Project } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const CELL_WIDTH = 40;

const phaseColors: Record<string, string> = {
  planning: "bg-blue-500",
  design: "bg-amber-500",
  execution: "bg-green-500",
  review: "bg-purple-500",
  completed: "bg-muted",
};

interface ProjectTimelineProps {
  onCreateProject?: () => void;
}

export function ProjectTimeline({ onCreateProject }: ProjectTimelineProps) {
  const { projects, isLoading } = useProjects();
  const [viewDate, setViewDate] = useState(new Date());
  
  const visibleStart = startOfMonth(subMonths(viewDate, 1));
  const visibleEnd = endOfMonth(addMonths(viewDate, 1));
  const visibleDays = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  const visibleMonths = eachMonthOfInterval({ start: visibleStart, end: visibleEnd });

  const today = startOfDay(new Date());
  const todayOffset = differenceInDays(today, visibleStart);

  const getBarPosition = (start: Date, end: Date) => {
    const startOffset = Math.max(0, differenceInDays(start, visibleStart));
    const endOffset = Math.min(visibleDays.length, differenceInDays(end, visibleStart) + 1);
    const width = Math.max(1, endOffset - startOffset);
    
    return {
      left: startOffset * CELL_WIDTH,
      width: width * CELL_WIDTH,
    };
  };

  const navigateMonth = (direction: -1 | 1) => {
    setViewDate(prev => direction === -1 ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour le visualiser dans la timeline."
          action={onCreateProject ? { label: "Créer un projet", onClick: onCreateProject } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Timeline Header */}
      <div className="flex-shrink-0 border-b border-border bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium ml-2">
              {format(viewDate, "MMMM yyyy")}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* Project Names Column */}
          <div className="w-64 flex-shrink-0 border-r border-border bg-background sticky left-0 z-20">
            <div className="h-14 border-b border-border bg-surface" />
            
            {projects.map((project) => (
              <div
                key={project.id}
                className="h-12 px-4 flex items-center border-b border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-1.5 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || "#000" }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{project.phase}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Area */}
          <div className="relative flex-1">
            {/* Month & Day Headers */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border">
              <div className="flex h-8 border-b border-border">
                {visibleMonths.map((month) => {
                  const monthStart = startOfMonth(month);
                  const monthEnd = endOfMonth(month);
                  const startOffset = Math.max(0, differenceInDays(monthStart, visibleStart));
                  const daysInMonth = differenceInDays(
                    monthEnd > visibleEnd ? visibleEnd : monthEnd,
                    monthStart < visibleStart ? visibleStart : monthStart
                  ) + 1;

                  return (
                    <div
                      key={month.toISOString()}
                      className="flex items-center justify-center text-xs font-medium border-r border-border"
                      style={{ width: daysInMonth * CELL_WIDTH }}
                    >
                      {format(month, "MMMM yyyy")}
                    </div>
                  );
                })}
              </div>

              <div className="flex h-6">
                {visibleDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex items-center justify-center text-2xs border-r border-border",
                      isSameDay(day, today) && "bg-foreground text-background font-medium",
                      (day.getDay() === 0 || day.getDay() === 6) && "text-muted-foreground"
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Bars */}
            <div className="relative">
              {todayOffset >= 0 && todayOffset < visibleDays.length && (
                <div 
                  className="today-indicator"
                  style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }}
                >
                  <div className="today-label">Today</div>
                </div>
              )}

              <div className="absolute inset-0 flex pointer-events-none">
                {visibleDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "border-r border-border h-full",
                      (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/30"
                    )}
                    style={{ width: CELL_WIDTH }}
                  />
                ))}
              </div>

              {projects.map((project) => {
                const startDate = project.start_date ? new Date(project.start_date) : today;
                const endDate = project.end_date ? new Date(project.end_date) : addMonths(startDate, 1);
                const { left, width } = getBarPosition(startDate, endDate);
                
                return (
                  <div key={project.id} className="h-12 relative border-b border-border">
                    <div
                      className="absolute top-2 h-8 rounded-md flex items-center px-3 gap-2 cursor-pointer transition-all hover:shadow-md bg-card border border-border"
                      style={{ left, width: Math.max(width, 80) }}
                    >
                      <div 
                        className="w-1 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || "#000" }}
                      />
                      
                      {width > 120 && (
                        <span className="text-xs font-medium truncate flex-1">
                          {project.name}
                        </span>
                      )}
                      
                      <span className={cn(
                        "text-2xs px-1.5 py-0.5 rounded capitalize",
                        phaseColors[project.phase] || "bg-muted"
                      )}>
                        {project.phase}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
