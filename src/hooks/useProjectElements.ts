import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ElementType, ElementVisibility } from "@/lib/elementTypes";

export interface CredentialData {
  username?: string;
  password?: string;
  service?: string;
  notes?: string;
}

export interface ProjectElement {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  description: string | null;
  element_type: ElementType;
  url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  tags: string[];
  category: string | null;
  visibility: ElementVisibility;
  is_pinned: boolean;
  is_sensitive: boolean;
  credential_data: CredentialData | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateElementData {
  project_id: string;
  title: string;
  description?: string;
  element_type: ElementType;
  url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  tags?: string[];
  category?: string;
  visibility?: ElementVisibility;
  is_pinned?: boolean;
  is_sensitive?: boolean;
  credential_data?: CredentialData;
}

export interface UpdateElementData extends Partial<CreateElementData> {
  id: string;
}

export function useProjectElements(projectId: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: elements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project-elements", projectId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("project_elements")
        .select("*")
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectElement[];
    },
    enabled: !!projectId && !!activeWorkspace?.id,
  });

  const addElement = useMutation({
    mutationFn: async (data: CreateElementData) => {
      if (!activeWorkspace?.id || !user?.id) {
        throw new Error("Workspace ou utilisateur non défini");
      }

      const insertData = {
        project_id: data.project_id,
        title: data.title,
        description: data.description,
        element_type: data.element_type as any,
        url: data.url,
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size,
        file_type: data.file_type,
        tags: data.tags || [],
        category: data.category,
        visibility: data.visibility || 'all',
        is_pinned: data.is_pinned || false,
        is_sensitive: data.is_sensitive || false,
        credential_data: data.credential_data as any,
        workspace_id: activeWorkspace.id,
        created_by: user.id,
      };

      const { data: newElement, error } = await supabase
        .from("project_elements")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return newElement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
      toast.success("Élément ajouté avec succès");
    },
    onError: (error) => {
      console.error("Error adding element:", error);
      toast.error("Erreur lors de l'ajout de l'élément");
    },
  });

  const updateElement = useMutation({
    mutationFn: async ({ id, ...data }: UpdateElementData) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.element_type !== undefined) updateData.element_type = data.element_type;
      if (data.url !== undefined) updateData.url = data.url;
      if (data.file_url !== undefined) updateData.file_url = data.file_url;
      if (data.file_name !== undefined) updateData.file_name = data.file_name;
      if (data.file_size !== undefined) updateData.file_size = data.file_size;
      if (data.file_type !== undefined) updateData.file_type = data.file_type;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      if (data.is_pinned !== undefined) updateData.is_pinned = data.is_pinned;
      if (data.is_sensitive !== undefined) updateData.is_sensitive = data.is_sensitive;
      if (data.credential_data !== undefined) updateData.credential_data = data.credential_data;

      const { data: updatedElement, error } = await supabase
        .from("project_elements")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedElement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
      toast.success("Élément mis à jour");
    },
    onError: (error) => {
      console.error("Error updating element:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteElement = useMutation({
    mutationFn: async (id: string) => {
      // Récupérer l'élément pour supprimer le fichier si nécessaire
      const element = elements.find((e) => e.id === id);
      
      if (element?.file_url) {
        // Extraire le path du fichier depuis l'URL
        const urlParts = element.file_url.split("/project-elements/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from("project-elements").remove([filePath]);
        }
      }

      const { error } = await supabase
        .from("project_elements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
      toast.success("Élément supprimé");
    },
    onError: (error) => {
      console.error("Error deleting element:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from("project_elements")
        .update({ is_pinned })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-elements", projectId] });
    },
  });

  const uploadFile = async (file: File, projectId: string): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-elements")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("project-elements")
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
  };

  return {
    elements,
    isLoading,
    error,
    addElement,
    updateElement,
    deleteElement,
    togglePin,
    uploadFile,
  };
}
