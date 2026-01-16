import { EntityCommunications } from "@/components/shared/EntityCommunications";
import { useCommunicationsCount, EntityType } from "@/hooks/useCommunications";

interface TaskCommunicationsProps {
  taskId: string;
  // Context for aggregation - when task is linked to another entity
  contextEntityType?: EntityType;
  contextEntityId?: string;
}

/**
 * TaskCommunications - Wrapper around EntityCommunications for tasks
 * Uses the unified communications UI from EntityCommunications
 * Passes context so communications appear in parent entity (project, lead, etc.)
 */
export function TaskCommunications({ 
  taskId, 
  contextEntityType, 
  contextEntityId 
}: TaskCommunicationsProps) {
  return (
    <EntityCommunications
      entityType="task"
      entityId={taskId}
      contextEntityType={contextEntityType}
      contextEntityId={contextEntityId}
      className="h-full"
    />
  );
}

// Hook to get the count of communications for a task
export function useTaskCommunicationsCount(taskId: string | null) {
  const { data: count } = useCommunicationsCount("task", taskId, false);
  return count || 0;
}