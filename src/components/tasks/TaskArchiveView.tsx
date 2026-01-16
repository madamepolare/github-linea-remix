import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/hooks/useTasks";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Archive, RotateCcw, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export function TaskArchiveView() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: archivedTasks, isLoading } = useQuery({
    queryKey: ["archived-tasks", activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .eq("status", "archived")
        .is("parent_id", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const restoreTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "todo" })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tâche restaurée");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      toast.success("Tâche supprimée définitivement");
    },
  });

  const priorityLabels: Record<Task["priority"], string> = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    urgent: "Urgente",
  };

  const columns: DataTableColumn<Task>[] = [
    {
      id: "title",
      header: "Tâche",
      sortable: true,
      accessor: "title",
      render: (task) => (
        <div>
          <p className="font-medium text-muted-foreground">{task.title}</p>
          {task.description && (
            <p className="text-sm text-muted-foreground/70 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priorité",
      width: "w-28",
      sortable: true,
      accessor: "priority",
      sortFn: (a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      },
      render: (task) => (
        <Badge variant="outline">{priorityLabels[task.priority]}</Badge>
      ),
    },
    {
      id: "updated_at",
      header: "Archivée le",
      width: "w-36",
      sortable: true,
      accessor: (task) => task.updated_at ? new Date(task.updated_at) : null,
      render: (task) =>
        task.updated_at ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.updated_at), "d MMM yyyy", { locale: fr })}
          </div>
        ) : null,
    },
    {
      id: "actions",
      header: "Actions",
      width: "w-32",
      align: "right",
      render: (task) => (
        <div 
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => restoreTask.mutate(task.id)}
            title="Restaurer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Supprimer définitivement"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La tâche et toutes ses sous-tâches seront supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTask.mutate(task.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={archivedTasks || []}
        columns={columns}
        getRowKey={(task) => task.id}
        isLoading={isLoading}
        onRowClick={(task) => setSelectedTask(task)}
        defaultSortColumn="updated_at"
        defaultSortDirection="desc"
        emptyState={
          <div className="flex flex-col items-center justify-center py-8">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune tâche archivée</h3>
            <p className="text-muted-foreground max-w-sm">
              Les tâches que vous archivez apparaîtront ici. Vous pouvez les restaurer ou les supprimer définitivement.
            </p>
          </div>
        }
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}
