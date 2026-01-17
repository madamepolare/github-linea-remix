import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteAIEditPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  onApply: (lines: QuoteLine[]) => void;
}

export function QuoteAIEditPanel({ document, lines, onApply }: QuoteAIEditPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const editableLines = useMemo(
    () => lines.filter((l) => l.line_type !== 'group'),
    [lines]
  );

  const apply = async () => {
    const trimmed = instruction.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('edit-quote-lines', {
        body: {
          instruction: trimmed,
          projectType: document.project_type,
          projectDescription: document.description || document.title,
          lines: editableLines.map((l) => ({
            id: l.id,
            phase_code: l.phase_code,
            phase_name: l.phase_name,
            phase_description: l.phase_description,
            line_type: l.line_type,
            quantity: l.quantity,
            unit: l.unit,
            unit_price: l.unit_price,
            amount: l.amount,
            is_included: l.is_included,
            is_optional: l.is_optional,
            group_id: l.group_id,
            sort_order: l.sort_order,
          })),
        },
      });

      if (error) throw error;
      if (!data?.lines || !Array.isArray(data.lines)) {
        throw new Error('Réponse IA invalide');
      }

      const patchMap = new Map<string, any>(data.lines.map((x: any) => [x.id, x]));

      const updated = lines.map((line) => {
        if (line.line_type === 'group') return line;
        const patch = patchMap.get(line.id);
        if (!patch) return line;

        const nextUnitPrice = patch.unit_price ?? line.unit_price ?? 0;
        const nextQty = patch.quantity ?? line.quantity ?? 1;

        return {
          ...line,
          phase_name: patch.phase_name ?? line.phase_name,
          phase_description: patch.phase_description ?? line.phase_description,
          unit: patch.unit ?? line.unit,
          quantity: nextQty,
          unit_price: nextUnitPrice,
          amount: (nextQty || 1) * (nextUnitPrice || 0),
        };
      });

      onApply(updated);
      toast.success('Modifications IA appliquées');
    } catch (e) {
      console.error(e);
      toast.error("Impossible d'appliquer les modifications IA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Décris ce que tu veux changer (ex: "raccourcir les descriptions", "renommer les lignes", "mettre un ton plus juridique").
      </div>
      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Ex: reformule toutes les descriptions en 2 phrases, ton pro, orienté livrables…"
        rows={5}
      />
      <div className="flex justify-end">
        <Button onClick={apply} disabled={!instruction.trim() || isLoading || editableLines.length === 0}>
          {isLoading ? 'Traitement…' : 'Appliquer'}
        </Button>
      </div>
    </div>
  );
}
