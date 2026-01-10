import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { QuoteLine } from '@/types/quoteTypes';
import { toast } from 'sonner';

interface AIDescriptionButtonProps {
  line: QuoteLine;
  projectType?: string;
  projectDescription?: string;
  onDescriptionGenerated: (description: string) => void;
}

export function AIDescriptionButton({
  line,
  projectType,
  projectDescription,
  onDescriptionGenerated
}: AIDescriptionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!line.phase_name) {
      toast.error('Veuillez d\'abord saisir un nom pour la ligne');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-line-description', {
        body: {
          lineName: line.phase_name,
          lineType: line.line_type,
          projectType,
          projectDescription,
          context: line.phase_code ? `Phase ${line.phase_code}` : undefined
        }
      });

      if (error) throw error;

      if (data.description) {
        onDescriptionGenerated(data.description);
        toast.success('Description générée');
      }

    } catch (error) {
      console.error('Error generating description:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleGenerate}
            disabled={isGenerating || !line.phase_name}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Générer la description avec l'IA</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
