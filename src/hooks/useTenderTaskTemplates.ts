import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addDays, format, parseISO } from 'date-fns';

interface TaskTemplate {
  title: string;
  description?: string;
  daysBeforeDeadline: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  phase: 'candidature' | 'offre' | 'global';
}

// Default task templates for tenders
const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  // Candidature phase
  {
    title: 'Analyser le RC et extraire les critères',
    description: 'Lecture détaillée du Règlement de Consultation pour identifier les critères de sélection et pondérations',
    daysBeforeDeadline: 14,
    priority: 'high',
    phase: 'candidature',
  },
  {
    title: 'Constituer l\'équipe projet',
    description: 'Identifier et confirmer les partenaires (BET, cotraitants) pour la candidature',
    daysBeforeDeadline: 12,
    priority: 'high',
    phase: 'candidature',
  },
  {
    title: 'Rassembler les pièces administratives',
    description: 'DC1, DC2, attestations fiscales et sociales, Kbis, assurances',
    daysBeforeDeadline: 10,
    priority: 'medium',
    phase: 'candidature',
  },
  {
    title: 'Préparer les références',
    description: 'Sélectionner et mettre en forme les références pertinentes',
    daysBeforeDeadline: 8,
    priority: 'medium',
    phase: 'candidature',
  },
  {
    title: 'Relecture finale candidature',
    description: 'Vérification complète du dossier avant dépôt',
    daysBeforeDeadline: 2,
    priority: 'urgent',
    phase: 'candidature',
  },
  
  // Offre phase
  {
    title: 'Visite de site',
    description: 'Organiser et effectuer la visite du site (si obligatoire)',
    daysBeforeDeadline: 20,
    priority: 'high',
    phase: 'offre',
  },
  {
    title: 'Rédiger la note méthodologique',
    description: 'Présentation de l\'approche et organisation proposées',
    daysBeforeDeadline: 15,
    priority: 'high',
    phase: 'offre',
  },
  {
    title: 'Préparer le mémoire technique',
    description: 'Rédaction du mémoire technique complet',
    daysBeforeDeadline: 12,
    priority: 'high',
    phase: 'offre',
  },
  {
    title: 'Compléter le DPGF / BPU',
    description: 'Remplir les documents de prix',
    daysBeforeDeadline: 8,
    priority: 'high',
    phase: 'offre',
  },
  {
    title: 'Réaliser le cas pratique',
    description: 'Produire les livrables du cas pratique si demandé',
    daysBeforeDeadline: 7,
    priority: 'high',
    phase: 'offre',
  },
  {
    title: 'Relecture et validation finale',
    description: 'Vérification complète de l\'offre avant dépôt',
    daysBeforeDeadline: 2,
    priority: 'urgent',
    phase: 'offre',
  },
];

export function useTenderTaskTemplates() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();

  // Generate tasks from templates
  const generateTenderTasks = useMutation({
    mutationFn: async ({
      tenderId,
      deadline,
      phase = 'global',
      customTemplates,
    }: {
      tenderId: string;
      deadline: string;
      phase?: 'candidature' | 'offre' | 'global';
      customTemplates?: TaskTemplate[];
    }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const templates = customTemplates || DEFAULT_TASK_TEMPLATES;
      const filteredTemplates = phase === 'global' 
        ? templates 
        : templates.filter(t => t.phase === phase || t.phase === 'global');

      const deadlineDate = parseISO(deadline);
      const tasksToCreate = filteredTemplates.map(template => {
        const dueDate = addDays(deadlineDate, -template.daysBeforeDeadline);
        
        return {
          workspace_id: activeWorkspace.id,
          tender_id: tenderId,
          title: template.title,
          description: template.description,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          priority: template.priority,
          status: 'todo',
          created_by: user?.id,
          tags: [`ao-${phase}`],
        };
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (error) throw error;

      return data;
    },
    onSuccess: (tasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`${tasks.length} tâches créées pour cet appel d'offres`);
    },
    onError: (error) => {
      console.error('Failed to generate tasks:', error);
      toast.error('Erreur lors de la création des tâches');
    },
  });

  // Get template suggestions based on tender data
  const getTaskSuggestions = (tender: {
    submission_type?: string;
    cas_pratique?: { requis?: boolean };
    site_visit_required?: boolean;
  }) => {
    let suggestions = [...DEFAULT_TASK_TEMPLATES];

    // Filter based on submission type
    if (tender.submission_type === 'candidature') {
      suggestions = suggestions.filter(t => t.phase === 'candidature' || t.phase === 'global');
    } else if (tender.submission_type === 'offre') {
      suggestions = suggestions.filter(t => t.phase === 'offre' || t.phase === 'global');
    }

    // Remove cas pratique task if not required
    if (!tender.cas_pratique?.requis) {
      suggestions = suggestions.filter(t => !t.title.toLowerCase().includes('cas pratique'));
    }

    // Remove visite if not required
    if (!tender.site_visit_required) {
      suggestions = suggestions.filter(t => !t.title.toLowerCase().includes('visite'));
    }

    return suggestions;
  };

  return {
    generateTenderTasks,
    getTaskSuggestions,
    defaultTemplates: DEFAULT_TASK_TEMPLATES,
  };
}
