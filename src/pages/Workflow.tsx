import { useState, useCallback } from "react";
import { TeamPlanningGrid } from "@/components/workflow/TeamPlanningGrid";
import { WorkflowSidebar } from "@/components/workflow/WorkflowSidebar";
import { ScheduleDetailSheet } from "@/components/workflow/ScheduleDetailSheet";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { Button } from "@/components/ui/button";
import { PanelRight, CalendarClock, Plus } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";

export default function Workflow() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<TaskSchedule | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  
  const { createSchedule } = useTaskSchedules();

  const handleEventClick = useCallback((schedule: TaskSchedule) => {
    setSelectedSchedule(schedule);
    setDetailSheetOpen(true);
  }, []);

  const handleCellClick = useCallback((date: Date, member: TeamMember) => {
    // TODO: Ouvrir un dialog pour créer une nouvelle planification
    console.log("Cell clicked:", date, member);
  }, []);

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

          <div className="flex items-center gap-2">
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
          <TeamPlanningGrid
            onEventClick={handleEventClick}
            onCellClick={handleCellClick}
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
