import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SearchResult {
  id: string;
  type: "task" | "project" | "contact";
  title: string;
  subtitle?: string;
  url: string;
}

export function useGlobalSearch(query: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["global-search", activeWorkspace?.id, query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];

      const results: SearchResult[] = [];
      const searchTerm = `%${query}%`;

      // Search tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, project_id")
        .eq("workspace_id", activeWorkspace!.id)
        .ilike("title", searchTerm)
        .limit(5);

      if (tasks) {
        results.push(
          ...tasks.map((task) => ({
            id: task.id,
            type: "task" as const,
            title: task.title,
            subtitle: task.status,
            url: "/tasks",
          }))
        );
      }

      // Search projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, client, status")
        .eq("workspace_id", activeWorkspace!.id)
        .ilike("name", searchTerm)
        .limit(5);

      if (projects) {
        results.push(
          ...projects.map((project) => ({
            id: project.id,
            type: "project" as const,
            title: project.name,
            subtitle: project.client || project.status,
            url: "/projects",
          }))
        );
      }

      // Search contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, email, role")
        .eq("workspace_id", activeWorkspace!.id)
        .ilike("name", searchTerm)
        .limit(5);

      if (contacts) {
        results.push(
          ...contacts.map((contact) => ({
            id: contact.id,
            type: "contact" as const,
            title: contact.name,
            subtitle: contact.role || contact.email,
            url: "/crm",
          }))
        );
      }

      return results;
    },
    enabled: !!activeWorkspace?.id && query.length >= 2,
    staleTime: 1000,
  });
}
