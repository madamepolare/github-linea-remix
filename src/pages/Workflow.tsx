import { useState, useCallback, useEffect } from "react";
import { TeamPlanningGrid } from "@/components/workflow/TeamPlanningGrid";
import { TimelinePlanningGrid } from "@/components/workflow/TimelinePlanningGrid";
import { MobilePlanningView } from "@/components/workflow/MobilePlanningView";
import { WorkflowSidebar } from "@/components/workflow/WorkflowSidebar";
import { ScheduleDetailSheet } from "@/components/workflow/ScheduleDetailSheet";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { PanelRight, CalendarClock, LayoutGrid, Clock } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { useMediaQuery } from "@/hooks/use-media-query";

type ViewType = "grid" | "timeline";

export default function Workflow() {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [view, setView] = useState<ViewType>("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<TaskSchedule | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  
  const { createSchedule } = useTaskSchedules();

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleEventClick = useCallback((schedule: TaskSchedule) => {
    setSelectedSchedule(schedule);
    setDetailSheetOpen(true);
  }, []);

  const handleCellClick = useCallback((date: Date, member: TeamMember) => {
    console.log("Cell clicked:", date, member);
  }, []);

  const handleTaskSelect = useCallback((task: any) => {
    setSelectedTask(task as Task);
    setTaskSheetOpen(true);
  }, []);

  // Mobile view
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <MobilePlanningView onEventClick={handleEventClick} />
        
        {/* Schedule detail sheet */}
        <ScheduleDetailSheet
          schedule={selectedSchedule}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
        />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main planning area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Planning d'équipe</h1>
              <p className="text-sm text-muted-foreground">
                Visualisez et planifiez les tâches de votre équipe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ViewSwitcher
              value={view}
              onChange={(v) => setView(v as ViewType)}
              options={[
                { value: "timeline", label: "Agenda", icon: <Clock className="h-4 w-4" /> },
                { value: "grid", label: "Grille", icon: <LayoutGrid className="h-4 w-4" /> },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelRight className="h-4 w-4 mr-2" />
              {sidebarOpen ? "Masquer" : "Afficher"} le panneau
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {view === "timeline" ? (
            <TimelinePlanningGrid
              onEventClick={handleEventClick}
            />
          ) : (
            <TeamPlanningGrid
              onEventClick={handleEventClick}
              onCellClick={handleCellClick}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <WorkflowSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onTaskSelect={handleTaskSelect}
      />

      {/* Schedule detail sheet */}
      <ScheduleDetailSheet
        schedule={selectedSchedule}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
      />
    </div>
  );
}