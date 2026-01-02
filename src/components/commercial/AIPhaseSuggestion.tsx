import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CommercialDocument, CommercialDocumentPhase, ProjectType } from '@/lib/commercialTypes';

interface AIPhaseSuggestionProps {
  document: Partial<CommercialDocument>;
  onPhasesChange: (phases: CommercialDocumentPhase[]) => void;
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
  documentId?: string;
}

interface SuggestedPhase {
  code: string;
  name: string;
  description?: string;
  percentage: number;
  isIncluded: boolean;
  deliverables: string[];
}

interface SuggestionResponse {
  phases: SuggestedPhase[];
  feePercentage?: number;
  reasoning: string;
}

export function AIPhaseSuggestion({
  document,
  onPhasesChange,
  onDocumentChange,
  documentId
}: AIPhaseSuggestionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('suggest-commercial-phases', {
        body: {
          projectType: document.project_type,
          projectDescription: document.description,
          projectBudget: document.project_budget,
          projectSurface: document.project_surface,
          documentType: document.document_type
        }
      });

      if (error) throw error;

      const suggestions = data as SuggestionResponse;
      
      // Convert AI suggestions to phases
      const newPhases: CommercialDocumentPhase[] = suggestions.phases.map((phase, index) => ({
        id: `ai-${index}`,
        document_id: documentId || '',
        phase_code: phase.code,
        phase_name: phase.name,
        phase_description: phase.description || '',
        percentage_fee: phase.percentage,
        amount: 0,
        is_included: phase.isIncluded,
        deliverables: phase.deliverables || [],
        sort_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      onPhasesChange(newPhases);

      // Update fee percentage if suggested
      if (suggestions.feePercentage) {
        onDocumentChange({
          ...document,
          fee_percentage: suggestions.feePercentage
        });
      }

      toast({
        title: "Phases suggérées par l'IA",
        description: suggestions.reasoning
      });

    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'obtenir les suggestions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSuggest}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Suggérer avec l'IA
    </Button>
  );
}
