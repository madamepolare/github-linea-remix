import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CommercialDocument, CommercialDocumentPhase } from '@/lib/commercialTypes';
import { QuoteLineItem } from '@/lib/quoteTemplates';

interface AIPhaseSuggestionProps {
  document: Partial<CommercialDocument>;
  onPhasesChange?: (phases: CommercialDocumentPhase[]) => void;
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
  onQuoteItemsChange?: (items: QuoteLineItem[]) => void;
  documentId?: string;
}

interface SuggestedPhase {
  code: string;
  name: string;
  description?: string;
  percentage: number;
  isIncluded: boolean;
  deliverables: string[];
  amount: number;
}

interface SuggestionResponse {
  phases: SuggestedPhase[];
  feePercentage?: number;
  totalFee?: number;
  reasoning: string;
}

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function AIPhaseSuggestion({
  document,
  onPhasesChange,
  onDocumentChange,
  onQuoteItemsChange,
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
          documentType: document.document_type,
          feePercentage: document.fee_percentage
        }
      });

      if (error) throw error;

      const suggestions = data as SuggestionResponse;
      
      // Convert AI suggestions to QuoteLineItems with amounts
      if (onQuoteItemsChange) {
        const newItems: QuoteLineItem[] = suggestions.phases.map((phase, index) => ({
          id: generateId(),
          type: 'phase' as const,
          code: phase.code,
          designation: phase.name,
          description: phase.description || '',
          quantity: 1,
          unit: 'forfait',
          unitPrice: phase.amount || 0,
          amount: phase.amount || 0,
          isOptional: !phase.isIncluded,
          deliverables: phase.deliverables || [],
          sortOrder: index
        }));
        onQuoteItemsChange(newItems);
      }

      // Also convert to phases for backward compatibility
      if (onPhasesChange) {
        const newPhases: CommercialDocumentPhase[] = suggestions.phases.map((phase, index) => ({
          id: generateId(),
          document_id: documentId || '',
          phase_code: phase.code,
          phase_name: phase.name,
          phase_description: phase.description || '',
          percentage_fee: phase.percentage,
          amount: phase.amount || 0,
          is_included: phase.isIncluded,
          deliverables: phase.deliverables || [],
          sort_order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        onPhasesChange(newPhases);
      }

      // Update fee percentage and total if suggested
      if (suggestions.feePercentage || suggestions.totalFee) {
        onDocumentChange({
          ...document,
          fee_percentage: suggestions.feePercentage || document.fee_percentage,
          total_amount: suggestions.totalFee
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
      disabled={isLoading || !document.project_budget}
      className="gap-2"
      title={!document.project_budget ? "Veuillez d'abord renseigner le budget travaux" : ""}
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
