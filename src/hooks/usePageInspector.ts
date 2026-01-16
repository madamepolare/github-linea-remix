import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzablePage } from '@/config/analyzablePages';
import { toast } from 'sonner';

export interface Issue {
  id: string;
  type: 'graphique' | 'comportement' | 'accessibilite' | 'responsive' | 'ux';
  severity: 'critique' | 'important' | 'mineur';
  title: string;
  description: string;
  location: string;
  lovablePrompt: string;
}

export interface InspectorResult {
  pageName: string;
  overallScore: number;
  issues: Issue[];
  suggestions: string[];
  analyzedAt: string;
}

export function usePageInspector() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<InspectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzePage = async (page: AnalyzablePage, additionalContext?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-page-inspector', {
        body: { page, additionalContext },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data as InspectorResult);
      toast.success(`Analyse de "${page.name}" terminée`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    result,
    error,
    analyzePage,
    clearResult,
  };
}
