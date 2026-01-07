import { useState, useCallback } from "react";
import { WorkflowCalendar } from "@/components/workflow/WorkflowCalendar";
import { WorkflowSidebar } from "@/components/workflow/WorkflowSidebar";
import { ScheduleDetailSheet } from "@/components/workflow/ScheduleDetailSheet";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { Button } from "@/components/ui/button";
import { PanelRight, CalendarClock } from "lucide-react";

export default function Workflow() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<TaskSchedule | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  
  const { createSchedule } = useTaskSchedules();

  const handleEventClick = useCallback((schedule: TaskSchedule) => {
    setSelectedSchedule(schedule);
    setDetailSheetOpen(true);
  }, []);

  const handleExternalDrop = useCallback((
    taskId: string,
    userId: string,
    start: Date,
    end: Date
  ) => {
    createSchedule.mutate({
      task_id: taskId,
      user_id: userId,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    });
  }, [createSchedule]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main calendar area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Workflow</h1>
              <p className="text-sm text-muted-foreground">
                  Planifiez les tâches de votre équipe
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelRight className="h-4 w-4 mr-2" />
              {sidebarOpen ? "Masquer" : "Afficher"} le panneau
            </Button>
          </div>

        <div className="flex-1 p-4">
          <WorkflowCalendar
            onEventClick={handleEventClick}
            externalDrop={handleExternalDrop}
          />
        </div>
      </div>

      {/* Sidebar */}
      <WorkflowSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Schedule detail sheet */}
      <ScheduleDetailSheet
        schedule={selectedSchedule}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}
