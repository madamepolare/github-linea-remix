import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RoadmapItem {
  id: string;
  workspace_id: string | null;
  title: string;
  description: string | null;
  category: string;
  status: 'delivered' | 'in_progress' | 'planned' | 'vision';
  priority: number;
  release_version: string | null;
  release_date: string | null;
  quarter: string | null;
  icon: string | null;
  color: string | null;
  module_slug: string | null;
  votes_count: number;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  user_voted?: boolean;
}

export interface RoadmapIdea {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'implemented';
  priority: string;
  votes_count: number;
  admin_notes: string | null;
  converted_to_roadmap_id: string | null;
  created_at: string;
  updated_at: string;
  user_voted?: boolean;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateIdeaInput {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
}

export const IDEA_CATEGORIES = [
  { value: 'feature', label: 'Nouvelle fonctionnalité' },
  { value: 'improvement', label: 'Amélioration' },
  { value: 'integration', label: 'Intégration' },
  { value: 'other', label: 'Autre' },
];

export const IDEA_STATUSES = [
  { value: 'pending', label: 'En attente', color: 'bg-muted' },
  { value: 'reviewed', label: 'En cours d\'analyse', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'approved', label: 'Approuvé', color: 'bg-green-500/10 text-green-600' },
  { value: 'rejected', label: 'Rejeté', color: 'bg-destructive/10 text-destructive' },
  { value: 'implemented', label: 'Implémenté', color: 'bg-primary/10 text-primary' },
];

export const ROADMAP_STATUSES = [
  { value: 'delivered', label: 'Livré', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { value: 'in_progress', label: 'En cours', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'planned', label: 'Planifié', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { value: 'vision', label: 'Vision', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
];

// Default delivered modules
export const DELIVERED_MODULES: Omit<RoadmapItem, 'id' | 'created_at' | 'updated_at'>[] = [
  { workspace_id: null, title: 'Dashboard & Pilotage', description: 'Tableau de bord consolidé avec KPIs temps réel, widgets personnalisables et vue d\'ensemble de l\'activité', category: 'module', status: 'delivered', priority: 100, release_version: '1.0', release_date: null, quarter: null, icon: 'LayoutDashboard', color: 'blue', module_slug: 'dashboard', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'CRM Intégré', description: 'Gestion complète des entreprises, contacts et leads avec pipeline commercial, historique des échanges et segmentation', category: 'module', status: 'delivered', priority: 99, release_version: '1.0', release_date: null, quarter: null, icon: 'Building2', color: 'green', module_slug: 'crm', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Gestion de Projets', description: 'Phases, livrables, timeline, vues Board/List/Timeline, budgets et suivi d\'avancement', category: 'module', status: 'delivered', priority: 98, release_version: '1.0', release_date: null, quarter: null, icon: 'FolderKanban', color: 'purple', module_slug: 'projects', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Tâches & Kanban', description: 'Système complet avec sous-tâches, assignation, priorités, tags, dépendances et vues multiples', category: 'module', status: 'delivered', priority: 97, release_version: '1.0', release_date: null, quarter: null, icon: 'CheckSquare', color: 'orange', module_slug: 'tasks', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Devis & Commercial', description: 'Quote Builder avancé avec phases, modèles, thèmes PDF personnalisables et échéanciers', category: 'module', status: 'delivered', priority: 96, release_version: '1.0', release_date: null, quarter: null, icon: 'FileText', color: 'emerald', module_slug: 'commercial', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Appels d\'Offres', description: 'Suivi complet des AO avec analyse DCE, disciplines, synthèse et templates par spécialité', category: 'module', status: 'delivered', priority: 95, release_version: '1.0', release_date: null, quarter: null, icon: 'FileSearch', color: 'amber', module_slug: 'tenders', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Facturation', description: 'Suivi des factures, échéances, relances et intégration Chorus Pro', category: 'module', status: 'delivered', priority: 94, release_version: '1.0', release_date: null, quarter: null, icon: 'Receipt', color: 'teal', module_slug: 'invoicing', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Messagerie & Collaboration', description: 'Channels, DMs, fils de discussion par entité, réactions, mentions et GIFs', category: 'module', status: 'delivered', priority: 93, release_version: '1.0', release_date: null, quarter: null, icon: 'MessageSquare', color: 'indigo', module_slug: 'messages', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Notifications Push', description: 'Notifications temps réel dans l\'app et push navigateur/mobile avec préférences granulaires', category: 'module', status: 'delivered', priority: 92, release_version: '1.0', release_date: null, quarter: null, icon: 'Bell', color: 'rose', module_slug: 'notifications', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Équipe & RH', description: 'Annuaire, profils, absences, temps de travail, entretiens et gestion de paie', category: 'module', status: 'delivered', priority: 91, release_version: '1.0', release_date: null, quarter: null, icon: 'Users', color: 'cyan', module_slug: 'team', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Rapports & Analytics', description: 'Analyses financières, projets, temps et RH avec exports et visualisations', category: 'module', status: 'delivered', priority: 90, release_version: '1.0', release_date: null, quarter: null, icon: 'BarChart3', color: 'violet', module_slug: 'reports', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Chantier & Suivi Travaux', description: 'Planning Gantt multi-lots, comptes-rendus PDF et suivi d\'interventions', category: 'module', status: 'delivered', priority: 89, release_version: '1.0', release_date: null, quarter: null, icon: 'HardHat', color: 'yellow', module_slug: 'chantier', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Documents', description: 'GED centralisée avec catégories, recherche et liaison aux projets/contacts', category: 'module', status: 'delivered', priority: 88, release_version: '1.0', release_date: null, quarter: null, icon: 'FileStack', color: 'slate', module_slug: 'documents', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Portail Client', description: 'Accès sécurisé pour clients avec suivi projets, devis et tâches', category: 'module', status: 'delivered', priority: 87, release_version: '1.0', release_date: null, quarter: null, icon: 'ExternalLink', color: 'sky', module_slug: 'portal', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Bibliothèques', description: 'Matériaux, objets et références réutilisables', category: 'module', status: 'delivered', priority: 86, release_version: '1.0', release_date: null, quarter: null, icon: 'Library', color: 'stone', module_slug: 'libraries', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Assistant IA Linea', description: 'Requêtes en langage naturel sur vos données via Cmd+K', category: 'feature', status: 'delivered', priority: 85, release_version: '1.0', release_date: null, quarter: null, icon: 'Sparkles', color: 'fuchsia', module_slug: 'ai', votes_count: 0, is_public: true, created_by: null },
  { workspace_id: null, title: 'Permissions & Rôles', description: 'Système de permissions granulaires par rôle avec overrides workspace', category: 'feature', status: 'delivered', priority: 84, release_version: '1.0', release_date: null, quarter: null, icon: 'Shield', color: 'red', module_slug: 'permissions', votes_count: 0, is_public: true, created_by: null },
];

export function useRoadmap() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch roadmap items (global + workspace-specific)
  const { data: roadmapItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['roadmap_items', activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .or(`workspace_id.is.null,workspace_id.eq.${activeWorkspace?.id}`)
        .order('priority', { ascending: false });

      if (error) throw error;

      // Check user votes
      if (user && data.length > 0) {
        const { data: votes } = await supabase
          .from('roadmap_votes')
          .select('roadmap_item_id')
          .eq('user_id', user.id)
          .in('roadmap_item_id', data.map(d => d.id));

        const votedIds = new Set(votes?.map(v => v.roadmap_item_id) || []);
        return data.map(item => ({
          ...item,
          user_voted: votedIds.has(item.id)
        })) as RoadmapItem[];
      }

      return data as RoadmapItem[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Fetch user ideas
  const { data: ideas = [], isLoading: isLoadingIdeas } = useQuery({
    queryKey: ['roadmap_ideas', activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roadmap_ideas')
        .select('*')
        .eq('workspace_id', activeWorkspace!.id)
        .order('votes_count', { ascending: false });

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Check user votes
      let votedIds = new Set<string>();
      if (user && data.length > 0) {
        const { data: votes } = await supabase
          .from('roadmap_votes')
          .select('idea_id')
          .eq('user_id', user.id)
          .in('idea_id', data.map(d => d.id));

        votedIds = new Set(votes?.map(v => v.idea_id) || []);
      }

      return data.map(idea => ({
        ...idea,
        author: profileMap.get(idea.user_id) || null,
        user_voted: votedIds.has(idea.id)
      })) as RoadmapIdea[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Create idea
  const createIdea = useMutation({
    mutationFn: async (input: CreateIdeaInput) => {
      const { data, error } = await supabase
        .from('roadmap_ideas')
        .insert({
          workspace_id: activeWorkspace!.id,
          user_id: user!.id,
          title: input.title,
          description: input.description || null,
          category: input.category || 'feature',
          priority: input.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_ideas'] });
      toast.success('Idée soumise avec succès !');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Vote for idea
  const voteIdea = useMutation({
    mutationFn: async ({ ideaId, remove }: { ideaId: string; remove?: boolean }) => {
      if (remove) {
        const { error } = await supabase
          .from('roadmap_votes')
          .delete()
          .eq('user_id', user!.id)
          .eq('idea_id', ideaId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roadmap_votes')
          .insert({
            user_id: user!.id,
            idea_id: ideaId,
            vote_type: 'upvote',
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_ideas'] });
    },
  });

  // Vote for roadmap item
  const voteRoadmapItem = useMutation({
    mutationFn: async ({ itemId, remove }: { itemId: string; remove?: boolean }) => {
      if (remove) {
        const { error } = await supabase
          .from('roadmap_votes')
          .delete()
          .eq('user_id', user!.id)
          .eq('roadmap_item_id', itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roadmap_votes')
          .insert({
            user_id: user!.id,
            roadmap_item_id: itemId,
            vote_type: 'upvote',
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_items'] });
    },
  });

  // Update idea status (admin only)
  const updateIdeaStatus = useMutation({
    mutationFn: async ({ ideaId, status, adminNotes }: { ideaId: string; status: string; adminNotes?: string }) => {
      const { error } = await supabase
        .from('roadmap_ideas')
        .update({
          status,
          admin_notes: adminNotes,
        })
        .eq('id', ideaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_ideas'] });
      toast.success('Statut mis à jour');
    },
  });

  // Delete idea
  const deleteIdea = useMutation({
    mutationFn: async (ideaId: string) => {
      const { error } = await supabase
        .from('roadmap_ideas')
        .delete()
        .eq('id', ideaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap_ideas'] });
      toast.success('Idée supprimée');
    },
  });

  // Group items by status
  const deliveredItems = roadmapItems.filter(i => i.status === 'delivered');
  const inProgressItems = roadmapItems.filter(i => i.status === 'in_progress');
  const plannedItems = roadmapItems.filter(i => i.status === 'planned');
  const visionItems = roadmapItems.filter(i => i.status === 'vision');

  // Stats
  const pendingIdeas = ideas.filter(i => i.status === 'pending').length;
  const approvedIdeas = ideas.filter(i => i.status === 'approved').length;

  return {
    roadmapItems,
    deliveredItems,
    inProgressItems,
    plannedItems,
    visionItems,
    ideas,
    pendingIdeas,
    approvedIdeas,
    isLoading: isLoadingItems || isLoadingIdeas,
    createIdea,
    voteIdea,
    voteRoadmapItem,
    updateIdeaStatus,
    deleteIdea,
  };
}
