import { useMemo } from "react";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { useTaskSchedules } from "./useTaskSchedules";
import { useTeamMembers } from "./useTeamMembers";
import { useWorkspaceEvents } from "./useWorkspaceEvents";
import { useAllProjectMembers } from "./useProjects";
import { useTeamAbsences } from "./useTeamAbsences";
import { useTeamTimeEntries } from "./useTeamTimeEntries";
import { useTeams } from "./useTeams";

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

  // Filter absences to the visible date range
  const filteredAbsences = useMemo(() => {
    if (!absences) return [];
    
    const rangeStart = new Date(dateRange.startDate);
    const rangeEnd = new Date(dateRange.endDate);
    
    return absences.filter(absence => {
      const absenceStart = new Date(absence.start_date);
      const absenceEnd = new Date(absence.end_date);
      return absenceStart <= rangeEnd && absenceEnd >= rangeStart;
    });
  }, [absences, dateRange]);

  const isLoading = schedulesLoading || membersLoading || eventsLoading || 
    projectMembersLoading || absencesLoading || timeEntriesLoading || teamsLoading;

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
