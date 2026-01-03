import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  addMonths,
  subMonths,
  differenceInDays,
  isSameDay,
  startOfDay,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useProjects, Project, ProjectPhase } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PROJECT_TYPES, PHASE_STATUS_CONFIG } from "@/lib/projectTypes";

const CELL_WIDTH = 28;
const ROW_HEIGHT = 56;
const TODAY_POSITION_PERCENT = 0.25; // Today at 25% from left

interface ProjectTimelineProps {
  onCreateProject?: () => void;
}

export function ProjectTimeline({ onCreateProject }: ProjectTimelineProps) {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const [viewDate, setViewDate] = useState(new Date());

  // Calculate visible range with today at 25% from left
  const { visibleStart, visibleEnd, visibleDays, visibleMonths, todayOffset } = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Calculate how many days to show before and after today
    const totalVisibleDays = 90; // ~3 months
    const daysBeforeToday = Math.floor(totalVisibleDays * TODAY_POSITION_PERCENT);
    const daysAfterToday = totalVisibleDays - daysBeforeToday;
    
    const start = subMonths(startOfMonth(viewDate), 1);
    const end = endOfMonth(addMonths(viewDate, 2));
    
    const days = eachDayOfInterval({ start, end });
    const months = eachMonthOfInterval({ start, end });
    const offset = differenceInDays(today, start);
    
    return {
      visibleStart: start,
      visibleEnd: end,
      visibleDays: days,
      visibleMonths: months,
      todayOffset: offset,
    };
  }, [viewDate]);

  const today = startOfDay(new Date());

  const getPhaseBarPosition = (phase: ProjectPhase) => {
    if (!phase.start_date || !phase.end_date) return null;
    
    const startDate = parseISO(phase.start_date);
    const endDate = parseISO(phase.end_date);
    
    const startOffset = Math.max(0, differenceInDays(startDate, visibleStart));
    const endOffset = Math.min(visibleDays.length, differenceInDays(endDate, visibleStart) + 1);
    const width = Math.max(1, endOffset - startOffset);
    
    if (startOffset >= visibleDays.length || endOffset <= 0) return null;
    
    return {
      left: startOffset * CELL_WIDTH,
      width: width * CELL_WIDTH,
    };
  };

  const getProjectBarPosition = (project: Project) => {
    const startDate = project.start_date ? parseISO(project.start_date) : today;
    const endDate = project.end_date ? parseISO(project.end_date) : addMonths(startDate, 3);
    
    const startOffset = Math.max(0, differenceInDays(startDate, visibleStart));
    const endOffset = Math.min(visibleDays.length, differenceInDays(endDate, visibleStart) + 1);
    const width = Math.max(1, endOffset - startOffset);
    
    return {
      left: startOffset * CELL_WIDTH,
      width: Math.max(width * CELL_WIDTH, 100),
    };
  };

  const navigateMonth = (direction: -1 | 1) => {
    setViewDate((prev) => (direction === -1 ? subMonths(prev, 1) : addMonths(prev, 1)));
  };

  const goToToday = () => {
    setViewDate(new Date());
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
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} className="h-7 w-7 sm:h-8 sm:w-8">
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} className="h-7 w-7 sm:h-8 sm:w-8">
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium ml-1 sm:ml-2 capitalize">
              {format(viewDate, "MMMM yyyy", { locale: fr })}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-7 sm:h-8 text-xs sm:text-sm">
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* Project Names Column */}
          <div className="w-48 sm:w-72 flex-shrink-0 border-r border-border bg-background sticky left-0 z-20">
            <div className="h-12 sm:h-14 border-b border-border bg-surface flex items-center px-3 sm:px-4">
              <span className="text-2xs sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projets
              </span>
            </div>

            {projects.map((project) => {
              const projectType = PROJECT_TYPES.find((t) => t.value === project.project_type);
              const currentPhase = project.phases?.find((p) => p.status === "in_progress");

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="h-12 sm:h-14 px-3 sm:px-4 flex items-center border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-1 sm:w-1.5 h-6 sm:h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || "#3B82F6" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 text-2xs sm:text-xs text-muted-foreground">
                        {projectType && <span className="hidden sm:inline">{projectType.label}</span>}
                        {currentPhase && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">{currentPhase.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  const daysInMonth =
                    differenceInDays(
                      monthEnd > visibleEnd ? visibleEnd : monthEnd,
                      monthStart < visibleStart ? visibleStart : monthStart
                    ) + 1;

                  return (
                    <div
                      key={month.toISOString()}
                      className="flex items-center justify-center text-xs font-medium border-r border-border capitalize"
                      style={{ width: daysInMonth * CELL_WIDTH }}
                    >
                      {format(month, "MMMM yyyy", { locale: fr })}
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
                      isSameDay(day, today) && "bg-primary text-primary-foreground font-medium",
                      (day.getDay() === 0 || day.getDay() === 6) && !isSameDay(day, today) && "text-muted-foreground bg-muted/30"
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Rows with Phases */}
            <div className="relative">
              {/* Today indicator - positioned at calculated offset */}
              {todayOffset >= 0 && todayOffset < visibleDays.length && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                  style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-2xs px-1.5 py-0.5 rounded whitespace-nowrap">
                    Aujourd'hui
                  </div>
                </div>
              )}

              {/* Background grid */}
              <div className="absolute inset-0 flex pointer-events-none">
                {visibleDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "border-r border-border h-full",
                      (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/20"
                    )}
                    style={{ width: CELL_WIDTH }}
                  />
                ))}
              </div>

              {/* Project rows */}
              {projects.map((project) => {
                const projectBar = getProjectBarPosition(project);
                const phases = project.phases || [];

                return (
                  <div
                    key={project.id}
                    className="h-12 sm:h-14 relative border-b border-border"
                    style={{ minHeight: ROW_HEIGHT }}
                  >
                    {/* Phase bars */}
                    {phases.length > 0 ? (
                      phases.map((phase) => {
                        const position = getPhaseBarPosition(phase);
                        if (!position) return null;

                        const statusConfig = PHASE_STATUS_CONFIG[phase.status as keyof typeof PHASE_STATUS_CONFIG] || PHASE_STATUS_CONFIG.pending;

                        return (
                          <Tooltip key={phase.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-2 h-10 rounded-md flex items-center px-2 gap-1.5 cursor-pointer transition-all hover:shadow-md border",
                                  phase.status === "completed" && "opacity-70"
                                )}
                                style={{
                                  left: position.left,
                                  width: Math.max(position.width, 24),
                                  backgroundColor: phase.color || project.color || "#3B82F6",
                                  borderColor: "rgba(0,0,0,0.1)",
                                }}
                              >
                                {position.width > 60 && (
                                  <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                                    {phase.name}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{phase.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {statusConfig.label}
                                </p>
                                {phase.start_date && phase.end_date && (
                                  <p className="text-xs">
                                    {format(parseISO(phase.start_date), "d MMM", { locale: fr })} -{" "}
                                    {format(parseISO(phase.end_date), "d MMM yyyy", { locale: fr })}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })
                    ) : (
                      // Fallback: show project bar if no phases
                      <div
                        className="absolute top-2 h-10 rounded-md flex items-center px-3 gap-2 cursor-pointer transition-all hover:shadow-md bg-card border border-border"
                        style={{
                          left: projectBar.left,
                          width: projectBar.width,
                        }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div
                          className="w-1 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || "#3B82F6" }}
                        />
                        {projectBar.width > 100 && (
                          <span className="text-xs font-medium truncate">{project.name}</span>
                        )}
                      </div>
                    )}
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
