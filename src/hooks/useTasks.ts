import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubtaskPreview {
  id: string;
  title: string;
  status: string;
  assigned_to: string[] | null;
  due_date: string | null;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string | null;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[] | null;
  assigned_to: string[] | null;
  created_by: string | null;
  completed_at: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  // New fields
  module: string | null;
  brief: string | null;
  related_type: string | null;
  related_id: string | null;
  crm_company_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  tender_id: string | null;
  deliverable_id: string | null;
  // Subtasks preview (not full Task objects)
  subtasks?: SubtaskPreview[];
}

interface UseTasksOptions {
  projectId?: string;
  assignedTo?: string;
  includeArchived?: boolean;
  relatedType?: string;
  relatedId?: string;
}

export function useTasks(options?: UseTasksOptions) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", activeWorkspace?.id, options],
    queryFn: async () => {
      // First, auto-archive old completed tasks (done > 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      await supabase
        .from("tasks")
        .update({ status: "archived" })
        .eq("workspace_id", activeWorkspace!.id)
        .eq("status", "done")
        .lt("completed_at", threeDaysAgo.toISOString());

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .is("parent_id", null)
        .order("sort_order", { ascending: true });

      if (!options?.includeArchived) {
        query = query.neq("status", "archived");
      }

      if (options?.projectId) {
        query = query.eq("project_id", options.projectId);
      }

      if (options?.assignedTo) {
        query = query.contains("assigned_to", [options.assignedTo]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch subtasks for each task
      const tasksWithSubtasks = await Promise.all(
        (data || []).map(async (task) => {
          const { data: subtasks } = await supabase
            .from("tasks")
            .select("id, title, status, assigned_to, due_date")
            .eq("parent_id", task.id)
            .order("sort_order");
          return { 
            ...task, 
            subtasks: (subtasks || []) as SubtaskPreview[] 
          };
        })
      );

      return tasksWithSubtasks as Task[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createTask = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask.title!,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date,
          estimated_hours: newTask.estimated_hours,
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
          // Entity linking fields
          project_id: newTask.project_id,
          lead_id: newTask.lead_id,
          crm_company_id: newTask.crm_company_id,
          contact_id: newTask.contact_id,
          tender_id: newTask.tender_id,
          related_type: newTask.related_type,
          related_id: newTask.related_id,
          module: newTask.module,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tâche créée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task["status"] }) => {
      const updates: Partial<Task> = { status };
      if (status === "done") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks", activeWorkspace?.id, options]);

      // Optimistically update the cache
      queryClient.setQueryData(
        ["tasks", activeWorkspace?.id, options],
        (old: Task[] | undefined) =>
          old?.map((task) =>
            task.id === id
              ? { ...task, status, completed_at: status === "done" ? new Date().toISOString() : null }
              : task
          )
      );

      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", activeWorkspace?.id, options], context.previousTasks);
      }
      toast.error("Failed to update task status: " + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}
