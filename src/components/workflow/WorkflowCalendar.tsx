import { useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { addHours } from "date-fns";

interface WorkflowCalendarProps {
  onEventClick?: (schedule: TaskSchedule) => void;
  onDateSelect?: (start: Date, end: Date, resourceId: string) => void;
  externalDrop?: (taskId: string, userId: string, start: Date, end: Date) => void;
}

export function WorkflowCalendar({ onEventClick, onDateSelect, externalDrop }: WorkflowCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { schedules, updateSchedule } = useTaskSchedules();
  const { data: members } = useTeamMembers();

  // Convert team members to FullCalendar resources
  const resources = (members || []).map(member => ({
    id: member.user_id,
    title: member.profile?.full_name || member.profile?.email || "Membre",
    extendedProps: {
      avatar: member.profile?.avatar_url,
      role: member.role,
    },
  }));

  // Convert schedules to FullCalendar events
  const events = (schedules || []).map(schedule => {
    const projectColor = schedule.task?.project?.color || "#6366f1";
    
    return {
      id: schedule.id,
      resourceId: schedule.user_id,
      title: schedule.task?.title || "Tâche",
      start: schedule.start_datetime,
      end: schedule.end_datetime,
      backgroundColor: schedule.color || projectColor,
      borderColor: schedule.color || projectColor,
      editable: !schedule.is_locked,
      extendedProps: {
        schedule,
        task: schedule.task,
        priority: schedule.task?.priority,
        projectName: schedule.task?.project?.name,
      },
    };
  });

  const handleEventDrop = useCallback((info: any) => {
    const schedule = info.event.extendedProps.schedule as TaskSchedule;
    
    updateSchedule.mutate({
      id: schedule.id,
      user_id: info.event.getResources()[0]?.id || schedule.user_id,
      start_datetime: info.event.start?.toISOString() || schedule.start_datetime,
      end_datetime: info.event.end?.toISOString() || schedule.end_datetime,
    });
  }, [updateSchedule]);

  const handleEventResize = useCallback((info: any) => {
    const schedule = info.event.extendedProps.schedule as TaskSchedule;
    
    updateSchedule.mutate({
      id: schedule.id,
      start_datetime: info.event.start?.toISOString() || schedule.start_datetime,
      end_datetime: info.event.end?.toISOString() || schedule.end_datetime,
    });
  }, [updateSchedule]);

  const handleEventClick = useCallback((info: any) => {
    const schedule = info.event.extendedProps.schedule as TaskSchedule;
    onEventClick?.(schedule);
  }, [onEventClick]);

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
        eventContent={(arg) => (
          <div className="px-1 py-0.5 overflow-hidden">
            <div className="font-medium text-xs truncate">{arg.event.title}</div>
            {arg.event.extendedProps.projectName && (
              <div className="text-[10px] opacity-75 truncate">
                {arg.event.extendedProps.projectName}
              </div>
            )}
          </div>
        )}
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
