import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EntityType } from "./useCommunications";

export interface EntityConversation {
  id: string; // Format: entity-{type}-{entityId}
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  entity_status?: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  message_count: number;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  task: "Tâche",
  project: "Projet",
  lead: "Opportunité",
  company: "Entreprise",
  contact: "Contact",
  tender: "Appel d'offres",
};

export function useEntityConversations() {
  const { user, activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["entity-conversations", user?.id, activeWorkspace?.id],
    queryFn: async (): Promise<EntityConversation[]> => {
      if (!user || !activeWorkspace) return [];

      // First, get all entities where user is assigned
      // Tasks: check assigned_to array field
      const { data: assignedTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .contains("assigned_to", [user.id]);
      
      // Projects: check project_members
      const { data: assignedProjects } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      const assignedTaskIds = new Set(assignedTasks?.map(t => t.id) || []);
      const assignedProjectIds = new Set(assignedProjects?.map(p => p.project_id) || []);

      // Get all communications for the workspace
      const { data: communications, error } = await supabase
        .from("communications")
        .select("id, entity_type, entity_id, content, created_at, created_by, mentions")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!communications || communications.length === 0) return [];

      // Filter communications to only include relevant entities
      const filteredComms = communications.filter((comm) => {
        // Always include if user created or is mentioned
        const isCreator = comm.created_by === user.id;
        const mentions = comm.mentions as string[] | null;
        const isMentioned = mentions?.includes(user.id);
        
        if (isCreator || isMentioned) return true;

        // Check if user is assigned to the entity
        if (comm.entity_type === "task" && assignedTaskIds.has(comm.entity_id)) {
          return true;
        }
        if (comm.entity_type === "project" && assignedProjectIds.has(comm.entity_id)) {
          return true;
        }

        // For other entity types (leads, tenders, etc.), only show if creator/mentioned
        return false;
      });

      if (filteredComms.length === 0) return [];

      // Group by entity
      const entityMap = new Map<string, {
        entity_type: EntityType;
        entity_id: string;
        messages: typeof filteredComms;
      }>();

      filteredComms.forEach((comm) => {
        const key = `${comm.entity_type}-${comm.entity_id}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, {
            entity_type: comm.entity_type as EntityType,
            entity_id: comm.entity_id,
            messages: [],
          });
        }
        entityMap.get(key)!.messages.push(comm);
      });

      // Get entity details for each unique entity
      const conversations: EntityConversation[] = [];

      for (const [key, data] of entityMap) {
        let entityName = "Sans nom";
        let entityStatus: string | undefined;

        // Fetch entity name based on type
        switch (data.entity_type) {
          case "task": {
            const { data: task } = await supabase
              .from("tasks")
              .select("title, status")
              .eq("id", data.entity_id)
              .single();
            if (task) {
              entityName = task.title;
              entityStatus = task.status;
            }
            break;
          }
          case "project": {
            const { data: project } = await supabase
              .from("projects")
              .select("name, status")
              .eq("id", data.entity_id)
              .single();
            if (project) {
              entityName = project.name;
              entityStatus = project.status;
            }
            break;
          }
          case "tender": {
            const { data: tender } = await supabase
              .from("tenders")
              .select("title, status")
              .eq("id", data.entity_id)
              .single();
            if (tender) {
              entityName = tender.title;
              entityStatus = tender.status;
            }
            break;
          }
          case "lead": {
            const { data: lead } = await supabase
              .from("leads")
              .select("title, status")
              .eq("id", data.entity_id)
              .single();
            if (lead) {
              entityName = lead.title;
              entityStatus = lead.status;
            }
            break;
          }
          case "company": {
            const { data: company } = await supabase
              .from("crm_companies")
              .select("name")
              .eq("id", data.entity_id)
              .single();
            if (company) {
              entityName = company.name;
            }
            break;
          }
          case "contact": {
            const { data: contact } = await supabase
              .from("contacts")
              .select("name")
              .eq("id", data.entity_id)
              .single();
            if (contact) {
              entityName = contact.name;
            }
            break;
          }
        }

        const lastMessage = data.messages[0];
        conversations.push({
          id: `entity-${data.entity_type}-${data.entity_id}`,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          entity_name: entityName,
          entity_status: entityStatus,
          last_message_at: lastMessage.created_at,
          last_message_preview: lastMessage.content.substring(0, 100),
          unread_count: 0,
          message_count: data.messages.length,
        });
      }

      // Sort by last message date
      conversations.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      return conversations;
    },
    enabled: !!user && !!activeWorkspace,
  });
}

export function getEntityTypeLabel(type: EntityType): string {
  return ENTITY_TYPE_LABELS[type] || type;
}
