import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, addMonths, subMonths, differenceInDays, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock project data
const mockProjects = [
  {
    id: "1",
    name: "Office Building Renovation",
    phase: "Design",
    startDate: new Date(2025, 0, 5),
    endDate: new Date(2025, 2, 15),
    color: "bg-blue-500",
    team: ["JD", "SM", "AK"],
  },
  {
    id: "2",
    name: "Residential Complex",
    phase: "Planning",
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 1, 28),
    color: "bg-green-500",
    team: ["PL", "MR"],
  },
  {
    id: "3",
    name: "Commercial Center",
    phase: "Execution",
    startDate: new Date(2024, 11, 15),
    endDate: new Date(2025, 3, 30),
    color: "bg-amber-500",
    team: ["JD", "CL", "RM"],
  },
  {
    id: "4",
    name: "Hospital Wing Extension",
    phase: "Review",
    startDate: new Date(2025, 0, 20),
    endDate: new Date(2025, 4, 10),
    color: "bg-purple-500",
    team: ["SM"],
  },
  {
    id: "5",
    name: "University Library",
    phase: "Design",
    startDate: new Date(2025, 1, 1),
    endDate: new Date(2025, 5, 30),
    color: "bg-rose-500",
    team: ["AK", "PL", "JD", "MR"],
  },
];

const CELL_WIDTH = 40; // Width per day
const ROW_HEIGHT = 48;

export function ProjectTimeline() {
  const [viewDate, setViewDate] = useState(new Date());
  
  // Calculate visible range (3 months)
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
            {/* Month headers spacer */}
            <div className="h-14 border-b border-border bg-surface" />
            
            {/* Project rows */}
            {mockProjects.map((project) => (
              <div
                key={project.id}
                className="h-12 px-4 flex items-center border-b border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-1.5 h-6 rounded-full flex-shrink-0", project.color)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.phase}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Area */}
          <div className="relative flex-1">
            {/* Month & Day Headers */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border">
              {/* Months */}
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
                      style={{ 
                        marginLeft: startOffset === 0 ? 0 : undefined,
                        width: daysInMonth * CELL_WIDTH 
                      }}
                    >
                      {format(month, "MMMM yyyy")}
                    </div>
                  );
                })}
              </div>

              {/* Days */}
              <div className="flex h-6">
                {visibleDays.map((day, i) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex items-center justify-center text-2xs border-r border-border",
                      isSameDay(day, today) && "bg-foreground text-background font-medium",
                      day.getDay() === 0 || day.getDay() === 6 ? "text-muted-foreground" : ""
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
              {/* Today indicator */}
              {todayOffset >= 0 && todayOffset < visibleDays.length && (
                <div 
                  className="today-indicator"
                  style={{ left: todayOffset * CELL_WIDTH + CELL_WIDTH / 2 }}
                >
                  <div className="today-label">Today</div>
                </div>
              )}

              {/* Grid lines */}
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

              {/* Project bars */}
              {mockProjects.map((project) => {
                const { left, width } = getBarPosition(project.startDate, project.endDate);
                
                return (
                  <div key={project.id} className="h-12 relative border-b border-border">
                    <div
                      className={cn(
                        "absolute top-2 h-8 rounded-md flex items-center px-3 gap-2 cursor-pointer transition-all hover:shadow-md",
                        "bg-card border border-border"
                      )}
                      style={{ left, width: Math.max(width, 80) }}
                    >
                      {/* Color indicator */}
                      <div className={cn("w-1 h-4 rounded-full flex-shrink-0", project.color)} />
                      
                      {/* Project name (if space allows) */}
                      {width > 120 && (
                        <span className="text-xs font-medium truncate flex-1">
                          {project.name}
                        </span>
                      )}
                      
                      {/* Team avatars */}
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        {project.team.slice(0, 3).map((initials, i) => (
                          <div
                            key={i}
                            className="h-5 w-5 rounded-full bg-foreground text-background text-2xs font-medium flex items-center justify-center border border-background"
                          >
                            {initials}
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-2xs font-medium flex items-center justify-center border border-background">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
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
