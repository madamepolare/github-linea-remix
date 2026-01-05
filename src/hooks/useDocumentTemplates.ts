import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DocumentCategory, DocumentType } from "@/lib/documentTypes";
import type { Json } from "@/integrations/supabase/types";

export interface TemplateVariable {
  key: string;
  label: string;
  category: 'agency' | 'project' | 'contact' | 'document' | 'dates';
  example?: string;
}

export interface TemplateStyles {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  logoPosition?: 'left' | 'center' | 'right';
  headerBackground?: string;
  footerBackground?: string;
}

export interface DocumentTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: DocumentCategory;
  document_type: DocumentType;
  content_schema: Record<string, unknown>;
  default_content: Record<string, unknown> | null;
  pdf_template: Record<string, unknown> | null;
  header_html: string | null;
  footer_html: string | null;
  body_template: string | null;
  styles: TemplateStyles;
  variables: TemplateVariable[];
  preview_image: string | null;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: DocumentCategory;
  document_type: DocumentType;
  content_schema?: Record<string, unknown>;
  default_content?: Record<string, unknown>;
  header_html?: string;
  footer_html?: string;
  body_template?: string;
  styles?: TemplateStyles;
  variables?: TemplateVariable[];
  is_active?: boolean;
}

// Available template variables
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Agency
  { key: 'agency.name', label: 'Nom de l\'agence', category: 'agency', example: 'Mon Agence' },
  { key: 'agency.address', label: 'Adresse de l\'agence', category: 'agency', example: '123 Rue Example' },
  { key: 'agency.email', label: 'Email de l\'agence', category: 'agency', example: 'contact@agence.fr' },
  { key: 'agency.phone', label: 'Téléphone de l\'agence', category: 'agency', example: '01 23 45 67 89' },
  { key: 'agency.siret', label: 'SIRET', category: 'agency', example: '123 456 789 00012' },
  { key: 'agency.logo', label: 'Logo de l\'agence', category: 'agency' },
  
  // Project
  { key: 'project.name', label: 'Nom du projet', category: 'project', example: 'Rénovation Maison' },
  { key: 'project.address', label: 'Adresse du projet', category: 'project', example: '456 Avenue Project' },
  { key: 'project.city', label: 'Ville du projet', category: 'project', example: 'Paris' },
  { key: 'project.client', label: 'Client du projet', category: 'project', example: 'M. Dupont' },
  { key: 'project.budget', label: 'Budget du projet', category: 'project', example: '150 000 €' },
  { key: 'project.surface', label: 'Surface', category: 'project', example: '120 m²' },
  
  // Contact
  { key: 'contact.name', label: 'Nom du contact', category: 'contact', example: 'Jean Dupont' },
  { key: 'contact.email', label: 'Email du contact', category: 'contact', example: 'jean@email.com' },
  { key: 'contact.phone', label: 'Téléphone du contact', category: 'contact', example: '06 12 34 56 78' },
  { key: 'contact.company', label: 'Société du contact', category: 'contact', example: 'ABC Corp' },
  { key: 'contact.role', label: 'Fonction du contact', category: 'contact', example: 'Directeur' },
  
  // Document
  { key: 'document.number', label: 'Numéro du document', category: 'document', example: 'DOC-2024-0001' },
  { key: 'document.title', label: 'Titre du document', category: 'document', example: 'Pouvoir' },
  { key: 'document.date', label: 'Date du document', category: 'document', example: '01/01/2024' },
  
  // Dates
  { key: 'current_date', label: 'Date actuelle', category: 'dates', example: '05/01/2025' },
  { key: 'valid_until', label: 'Date de validité', category: 'dates', example: '31/12/2025' },
];

export function useDocumentTemplates(category?: DocumentCategory) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  // Get all templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["document-templates", activeWorkspace?.id, category],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("document_templates")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("document_type", { ascending: true })
        .order("name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        styles: (t.styles || {}) as unknown as TemplateStyles,
        variables: (t.variables || []) as unknown as TemplateVariable[],
      })) as DocumentTemplate[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Get templates by document type
  const getTemplatesByType = (documentType: DocumentType) => {
    return templates.filter(t => t.document_type === documentType && t.is_active);
  };

  // Create template
  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("document_templates")
        .insert([{
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          name: input.name,
          description: input.description,
          category: input.category,
          document_type: input.document_type,
          content_schema: (input.content_schema || {}) as Json,
          default_content: input.default_content as Json,
          header_html: input.header_html,
          footer_html: input.footer_html,
          body_template: input.body_template,
          styles: (input.styles || {}) as unknown as Json,
          variables: (input.variables || []) as unknown as Json,
          is_active: input.is_active ?? true,
          is_system: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du modèle");
      console.error(error);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTemplateInput> & { id: string }) => {
      const { error } = await supabase
        .from("document_templates")
        .update({
          name: input.name,
          description: input.description,
          content_schema: input.content_schema as Json,
          default_content: input.default_content as Json,
          header_html: input.header_html,
          footer_html: input.footer_html,
          body_template: input.body_template,
          styles: input.styles as unknown as Json,
          variables: input.variables as unknown as Json,
          is_active: input.is_active,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle mis à jour");
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle supprimé");
    },
  });

  // Duplicate template
  const duplicateTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");

      const { data, error } = await supabase
        .from("document_templates")
        .insert([{
          workspace_id: template.workspace_id,
          created_by: user?.id,
          name: `${template.name} (copie)`,
          description: template.description,
          category: template.category,
          document_type: template.document_type,
          content_schema: template.content_schema as unknown as Json,
          default_content: template.default_content as unknown as Json,
          header_html: template.header_html,
          footer_html: template.footer_html,
          body_template: template.body_template,
          styles: template.styles as unknown as Json,
          variables: template.variables as unknown as Json,
          is_active: false,
          is_system: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle dupliqué");
    },
  });

  // Toggle template active status
  const toggleTemplate = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("document_templates")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
    },
  });

  return {
    templates,
    isLoading,
    getTemplatesByType,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplate,
    availableVariables: TEMPLATE_VARIABLES,
  };
}
