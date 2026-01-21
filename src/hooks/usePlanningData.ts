import { useMemo } from "react";
import { format, startOfWeek, addDays, subDays, isWithinInterval, isSameDay } from "date-fns";
import { useTaskSchedules } from "./useTaskSchedules";
import { useTeamMembers } from "./useTeamMembers";
import { useWorkspaceEvents } from "./useWorkspaceEvents";
import { useAllProjectMembers } from "./useProjects";
import { useTeamAbsences, TeamAbsence } from "./useTeamAbsences";
import { useTeamTimeEntries } from "./useTeamTimeEntries";
import { useTeams } from "./useTeams";
import { useApprenticeSchedules, generateSchoolDates } from "./useApprenticeSchedules";

interface UsePlanningDataOptions {
  currentDate: Date;
  daysToShow?: number;
}

/**
 * Optimized hook for planning data that fetches with date range filtering
 * to reduce the amount of data transferred and processed
 */
export function usePlanningData({ currentDate, daysToShow = 21 }: UsePlanningDataOptions) {
  // Calculate date range for queries
  const dateRange = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    // Add buffer days for events that might span across weeks
    const rangeStart = subDays(start, 7);
    const rangeEnd = addDays(start, daysToShow + 7);
    
    return {
      startDate: format(rangeStart, "yyyy-MM-dd"),
      endDate: format(rangeEnd, "yyyy-MM-dd"),
      startDateTime: rangeStart.toISOString(),
      endDateTime: rangeEnd.toISOString(),
    };
  }, [currentDate, daysToShow]);

  // Fetch schedules with date range filtering
  const { 
    schedules, 
    isLoading: schedulesLoading, 
    createSchedule, 
    deleteSchedule, 
    updateSchedule 
  } = useTaskSchedules({
    startDate: dateRange.startDateTime,
    endDate: dateRange.endDateTime,
  });

  // Fetch team members (no date filtering needed - static data)
  const { data: members, isLoading: membersLoading } = useTeamMembers();

  // Fetch events (already has internal caching, but we filter in component)
  const { data: events, isLoading: eventsLoading } = useWorkspaceEvents();

  // Fetch project members (static data)
  const { data: userProjectsMap, isLoading: projectMembersLoading } = useAllProjectMembers();

  // Fetch absences with approximate date range
  const { data: absences, isLoading: absencesLoading } = useTeamAbsences({ status: "approved" });

  // Fetch time entries with date range filtering
  const { data: timeEntries, isLoading: timeEntriesLoading } = useTeamTimeEntries({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Fetch teams (static data)
  const { teams, userTeamsMap, isLoading: teamsLoading } = useTeams();

  // Fetch apprentice schedules for school day absences
  const { data: apprenticeSchedules, isLoading: apprenticeSchedulesLoading } = useApprenticeSchedules();

  // Filter events to the visible date range (since events hook fetches all)
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    const rangeStart = new Date(dateRange.startDateTime);
    const rangeEnd = new Date(dateRange.endDateTime);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = event.end_datetime ? new Date(event.end_datetime) : eventStart;
      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    });
  }, [events, dateRange]);

  // Filter absences to the visible date range and add school days from apprentice schedules
  const filteredAbsences = useMemo(() => {
    const result: TeamAbsence[] = [];
    const rangeStart = new Date(dateRange.startDate);
    const rangeEnd = new Date(dateRange.endDate);
    
    // Add real absences
    if (absences) {
      absences.forEach(absence => {
        const absenceStart = new Date(absence.start_date);
        const absenceEnd = new Date(absence.end_date);
        if (absenceStart <= rangeEnd && absenceEnd >= rangeStart) {
          result.push(absence);
        }
      });
    }
    
    // Generate virtual "école" absences from apprentice schedules
    if (apprenticeSchedules) {
      apprenticeSchedules.forEach(schedule => {
        const schoolDates = generateSchoolDates(schedule);
        
        // Group consecutive school dates into single absence periods
        let currentStart: Date | null = null;
        let currentEnd: Date | null = null;
        
        schoolDates.forEach((date) => {
          // Only include dates in visible range
          if (!isWithinInterval(date, { start: rangeStart, end: rangeEnd })) return;
          
          if (!currentStart) {
            currentStart = date;
            currentEnd = date;
          } else if (currentEnd) {
            const daysDiff = (date.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24);
            // If within 3 days (accounting for weekends), extend the period
            if (daysDiff <= 3) {
              currentEnd = date;
            } else {
              // Save current period and start new
              result.push({
                id: `school-${schedule.id}-${format(currentStart, 'yyyy-MM-dd')}`,
                workspace_id: schedule.workspace_id,
                user_id: schedule.user_id,
                absence_type: "ecole",
                start_date: format(currentStart, 'yyyy-MM-dd'),
                end_date: format(currentEnd, 'yyyy-MM-dd'),
                start_half_day: false,
                end_half_day: false,
                reason: schedule.schedule_name,
                status: "approved",
                approved_by: null,
                approved_at: null,
                rejection_reason: null,
                created_at: schedule.created_at,
                updated_at: schedule.updated_at,
              });
              currentStart = date;
              currentEnd = date;
            }
          }
        });
        
        // Don't forget the last period
        if (currentStart && currentEnd) {
          result.push({
            id: `school-${schedule.id}-${format(currentStart, 'yyyy-MM-dd')}`,
            workspace_id: schedule.workspace_id,
            user_id: schedule.user_id,
            absence_type: "ecole",
            start_date: format(currentStart, 'yyyy-MM-dd'),
            end_date: format(currentEnd, 'yyyy-MM-dd'),
            start_half_day: false,
            end_half_day: false,
            reason: schedule.schedule_name,
            status: "approved",
            approved_by: null,
            approved_at: null,
            rejection_reason: null,
            created_at: schedule.created_at,
            updated_at: schedule.updated_at,
          });
        }
      });
    }
    
    return result;
  }, [absences, apprenticeSchedules, dateRange]);

  const isLoading = schedulesLoading || membersLoading || eventsLoading || 
    projectMembersLoading || absencesLoading || timeEntriesLoading || teamsLoading || apprenticeSchedulesLoading;

  return {
    // Data
    schedules: schedules || [],
    members: members || [],
    events: filteredEvents,
    absences: filteredAbsences,
    timeEntries: timeEntries || [],
    userProjectsMap,
    teams: teams || [],
    userTeamsMap,
    
    // Mutations
    createSchedule,
    deleteSchedule,
    updateSchedule,
    
    // Loading state
    isLoading,
    
    // Date range info
    dateRange,
  };
}
