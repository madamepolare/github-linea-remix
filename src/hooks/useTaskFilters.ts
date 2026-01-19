import { useState, useMemo, useCallback } from "react";
import { Task } from "@/hooks/useTasks";
import { isPast, isToday, startOfDay, endOfWeek } from "date-fns";

export interface TaskFiltersState {
  search: string;
  priorities: string[];
  assignees: string[];
  projects: string[];
  dueDateFilter: string | null;
  tags: string[];
  isScheduled: boolean | null;
}

export const defaultTaskFilters: TaskFiltersState = {
  search: "",
  priorities: [],
  assignees: [],
  projects: [],
  dueDateFilter: null,
  tags: [],
  isScheduled: null,
};

interface UseTaskFiltersOptions {
  scheduledTaskIds?: Set<string>;
  // Allow passing external filters for controlled mode
  externalFilters?: TaskFiltersState;
}

export function useTaskFilters(tasks: Task[] | undefined, options: UseTaskFiltersOptions = {}) {
  const { scheduledTaskIds, externalFilters } = options;
  const [internalFilters, setInternalFilters] = useState<TaskFiltersState>(defaultTaskFilters);
  
  // Use external filters if provided, otherwise internal
  const filters = externalFilters ?? internalFilters;
  const setFilters = setInternalFilters;

  // Extract unique tags from all tasks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks?.forEach(task => {
      task.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return (
      filters.priorities.length +
      filters.assignees.length +
      filters.projects.length +
      filters.tags.length +
      (filters.dueDateFilter ? 1 : 0) +
      (filters.isScheduled !== null ? 1 : 0) +
      (filters.search ? 1 : 0)
    );
  }, [filters]);

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    let result = tasks || [];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Priority filter (multi-select)
    if (filters.priorities.length > 0) {
      result = result.filter(task => filters.priorities.includes(task.priority));
    }

    // Assignee filter (multi-select)
    if (filters.assignees.length > 0) {
      result = result.filter(task =>
        task.assigned_to?.some(userId => filters.assignees.includes(userId))
      );
    }

    // Project filter (multi-select)
    if (filters.projects.length > 0) {
      result = result.filter(task =>
        task.project_id && filters.projects.includes(task.project_id)
      );
    }

    // Due date filter
    if (filters.dueDateFilter) {
      const today = startOfDay(new Date());
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      result = result.filter(task => {
        switch (filters.dueDateFilter) {
          case "overdue":
            return task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
          case "today":
            return task.due_date && isToday(new Date(task.due_date));
          case "week":
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            return dueDate >= today && dueDate <= weekEnd;
          case "no_date":
            return !task.due_date;
          default:
            return true;
        }
      });
    }

    // Tags filter (multi-select)
    if (filters.tags.length > 0) {
      result = result.filter(task =>
        task.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    // Scheduled filter
    if (filters.isScheduled !== null && scheduledTaskIds) {
      result = result.filter(task => {
        const isTaskScheduled = scheduledTaskIds.has(task.id);
        return filters.isScheduled ? isTaskScheduled : !isTaskScheduled;
      });
    }

    return result;
  }, [tasks, filters, scheduledTaskIds]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultTaskFilters);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = activeFiltersCount > 0;

  return {
    filters,
    setFilters,
    filteredTasks,
    availableTags,
    activeFiltersCount,
    hasActiveFilters,
    clearFilters,
  };
}
