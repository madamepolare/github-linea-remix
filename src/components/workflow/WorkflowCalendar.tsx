import { useRef, useCallback, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useWorkspaceEvents, WorkspaceEvent } from "@/hooks/useWorkspaceEvents";
import { useAllProjectMembers } from "@/hooks/useProjects";
import { addHours } from "date-fns";
import { Package } from "lucide-react";

// Event type colors matching TeamPlanningGrid
const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "#3b82f6", // blue
  milestone: "#f59e0b", // amber
  reminder: "#8b5cf6", // violet
  rendu: "#10b981", // emerald - deliverables
  site_visit: "#f97316", // orange
  deadline: "#ef4444", // red
};

interface WorkflowCalendarProps {
  onEventClick?: (schedule: TaskSchedule) => void;
  onDateSelect?: (start: Date, end: Date, resourceId: string) => void;
  externalDrop?: (taskId: string, userId: string, start: Date, end: Date) => void;
  onRenduClick?: (event: WorkspaceEvent) => void;
}

export function WorkflowCalendar({ onEventClick, onDateSelect, externalDrop, onRenduClick }: WorkflowCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { schedules, updateSchedule } = useTaskSchedules();
  const { data: members } = useTeamMembers();
  const { data: workspaceEvents } = useWorkspaceEvents();
  const { data: userProjectsMap } = useAllProjectMembers();
  
  // Track if we just performed a drag/drop or resize to prevent modal from opening
  const justDraggedRef = useRef(false);

  // Convert team members to FullCalendar resources
  const resources = (members || []).map(member => ({
    id: member.user_id,
    title: member.profile?.full_name || member.profile?.email || "Membre",
    extendedProps: {
      avatar: member.profile?.avatar_url,
      role: member.role,
    },
  }));

  // Combine task schedules and rendu events
  const events = useMemo(() => {
    const calendarEvents: any[] = [];
    
    // Add task schedules
    (schedules || []).forEach(schedule => {
      const projectColor = schedule.task?.project?.color || "#6366f1";
      
      calendarEvents.push({
        id: schedule.id,
        resourceId: schedule.user_id,
        title: schedule.task?.title || "Tâche",
        start: schedule.start_datetime,
        end: schedule.end_datetime,
        backgroundColor: schedule.color || projectColor,
        borderColor: schedule.color || projectColor,
        editable: !schedule.is_locked,
        extendedProps: {
          type: "schedule",
          schedule,
          task: schedule.task,
          priority: schedule.task?.priority,
          projectName: schedule.task?.project?.name,
        },
      });
    });

    // Add rendu events for project members
    (workspaceEvents || []).forEach(event => {
      if (event.source !== "project") return;
      const projectEvent = event as WorkspaceEvent;
      
      // Only show rendu events (deliverables)
      if (projectEvent.event_type !== "rendu") return;
      
      // Find all members assigned to this project
      members?.forEach(member => {
        const memberProjectIds = userProjectsMap?.get(member.user_id) || new Set<string>();
        
        if (projectEvent.project_id && memberProjectIds.has(projectEvent.project_id)) {
          calendarEvents.push({
            id: `rendu-${projectEvent.id}-${member.user_id}`,
            resourceId: member.user_id,
            title: projectEvent.title,
            start: projectEvent.start_datetime,
            end: projectEvent.end_datetime || projectEvent.start_datetime,
            backgroundColor: EVENT_TYPE_COLORS.rendu,
            borderColor: EVENT_TYPE_COLORS.rendu,
            editable: false,
            extendedProps: {
              type: "rendu",
              event: projectEvent,
              projectName: projectEvent.project?.name,
              isRendu: true,
            },
          });
        }
      });
    });

    return calendarEvents;
  }, [schedules, workspaceEvents, members, userProjectsMap]);

  const handleEventDrop = useCallback((info: any) => {
    // Mark that we just dragged - prevent click handler from opening modal
    justDraggedRef.current = true;
    setTimeout(() => { justDraggedRef.current = false; }, 100);
    
    // Don't allow rendu events to be dropped
    if (info.event.extendedProps.type === "rendu") {
      info.revert();
      return;
    }
    
    const schedule = info.event.extendedProps.schedule as TaskSchedule;
    
    updateSchedule.mutate({
      id: schedule.id,
      user_id: info.event.getResources()[0]?.id || schedule.user_id,
      start_datetime: info.event.start?.toISOString() || schedule.start_datetime,
      end_datetime: info.event.end?.toISOString() || schedule.end_datetime,
    });
  }, [updateSchedule]);

  const handleEventResize = useCallback((info: any) => {
    // Mark that we just resized - prevent click handler from opening modal
    justDraggedRef.current = true;
    setTimeout(() => { justDraggedRef.current = false; }, 100);
    
    // Don't allow rendu events to be resized
    if (info.event.extendedProps.type === "rendu") {
      info.revert();
      return;
    }
    
    const schedule = info.event.extendedProps.schedule as TaskSchedule;
    
    updateSchedule.mutate({
      id: schedule.id,
      start_datetime: info.event.start?.toISOString() || schedule.start_datetime,
      end_datetime: info.event.end?.toISOString() || schedule.end_datetime,
    });
  }, [updateSchedule]);

  const handleEventClick = useCallback((info: any) => {
    // Don't open modal if we just finished dragging or resizing
    if (justDraggedRef.current) {
      return;
    }
    
    const eventType = info.event.extendedProps.type;
    
    if (eventType === "rendu") {
      const event = info.event.extendedProps.event as WorkspaceEvent;
      onRenduClick?.(event);
    } else {
      const schedule = info.event.extendedProps.schedule as TaskSchedule;
      onEventClick?.(schedule);
    }
  }, [onEventClick, onRenduClick]);

  const handleDateSelect = useCallback((info: any) => {
    onDateSelect?.(info.start, info.end, info.resource?.id);
  }, [onDateSelect]);


  return (
    <div className="h-full workflow-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth",
        }}
        buttonText={{
          today: "Aujourd'hui",
          day: "Jour",
          week: "Semaine",
          month: "Mois",
        }}
        locale="fr"
        firstDay={1}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        expandRows={true}
        height="100%"
        resources={resources}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={handleEventClick}
        select={handleDateSelect}
        resourceAreaWidth="180px"
        resourceAreaHeaderContent="Équipe"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        eventContent={(arg) => {
          const isRendu = arg.event.extendedProps.isRendu;
          return (
            <div className="px-1 py-0.5 overflow-hidden flex items-center gap-1">
              {isRendu && (
                <Package className="w-3 h-3 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs truncate">{arg.event.title}</div>
                {arg.event.extendedProps.projectName && (
                  <div className="text-[10px] opacity-75 truncate">
                    {arg.event.extendedProps.projectName}
                  </div>
                )}
              </div>
            </div>
          );
        }}
        resourceLabelContent={(arg) => (
          <div className="flex items-center gap-2 px-2">
            {arg.resource.extendedProps.avatar ? (
              <img
                src={arg.resource.extendedProps.avatar}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {arg.resource.title?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm truncate">{arg.resource.title}</span>
          </div>
        )}
      />
    </div>
  );
}
