import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Task } from "./useTasks";

interface QuickTaskInput {
  title: string;
  status?: Task["status"];
  priority?: Task["priority"];
  due_date?: string;
  project_id?: string;
}

export function useQuickTasks() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const createQuickTask = useMutation({
    mutationFn: async (input: QuickTaskInput) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: input.title,
          status: input.status || "todo",
          priority: input.priority || "medium",
          due_date: input.due_date || null,
          project_id: input.project_id || null,
          workspace_id: activeWorkspace!.id,
          created_by: user?.id,
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

  const createMultipleTasks = useMutation({
    mutationFn: async (tasks: QuickTaskInput[]) => {
      const tasksToInsert = tasks.map((t, index) => ({
        title: t.title,
        status: t.status || "todo",
        priority: t.priority || "medium",
        due_date: t.due_date || null,
        project_id: t.project_id || null,
        workspace_id: activeWorkspace!.id,
        created_by: user?.id,
        sort_order: index,
      }));

      const { data, error } = await supabase
        .from("tasks")
        .insert(tasksToInsert as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${data.length} tâches créées`);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    createQuickTask,
    createMultipleTasks,
  };
}
