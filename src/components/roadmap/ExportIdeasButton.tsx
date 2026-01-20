import { useState } from "react";
import { Copy, Download, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RoadmapIdea, RoadmapItem } from "@/hooks/useRoadmap";

interface ExportIdeasButtonProps {
  ideas: RoadmapIdea[];
  roadmapItems: RoadmapItem[];
}

export function ExportIdeasButton({ ideas, roadmapItems }: ExportIdeasButtonProps) {
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    const delivered = roadmapItems.filter(i => i.status === 'delivered');
    const inProgress = roadmapItems.filter(i => i.status === 'in_progress');
    const planned = roadmapItems.filter(i => i.status === 'planned');
    const vision = roadmapItems.filter(i => i.status === 'vision');
    const pendingIdeas = ideas.filter(i => i.status === 'pending' || i.status === 'approved');

    let prompt = `# État actuel de la Roadmap Linea

## Modules & Fonctionnalités Livrés (${delivered.length})
${delivered.map(i => `- **${i.title}**: ${i.description || 'N/A'}`).join('\n')}

## En Cours de Développement (${inProgress.length})
${inProgress.length > 0 ? inProgress.map(i => `- **${i.title}**: ${i.description || 'N/A'} ${i.quarter ? `(${i.quarter})` : ''}`).join('\n') : 'Aucun'}

## Planifié (${planned.length})
${planned.length > 0 ? planned.map(i => `- **${i.title}**: ${i.description || 'N/A'} ${i.quarter ? `(${i.quarter})` : ''}`).join('\n') : 'Aucun'}

## Vision Long Terme (${vision.length})
${vision.length > 0 ? vision.map(i => `- **${i.title}**: ${i.description || 'N/A'}`).join('\n') : 'Aucun'}

## Idées Utilisateurs en Attente (${pendingIdeas.length})
${pendingIdeas.length > 0 
  ? pendingIdeas.map(i => `- **${i.title}** (${i.votes_count} votes): ${i.description || 'N/A'} [Catégorie: ${i.category}]`).join('\n') 
  : 'Aucune idée en attente'}

---

## Instructions pour l'IA

Utilise cette roadmap pour:
1. Comprendre l'état actuel des fonctionnalités de l'application
2. Prioriser les développements en fonction des votes utilisateurs
3. Identifier les opportunités d'amélioration cohérentes avec la vision
4. Proposer des implémentations pour les idées les plus demandées

Les idées avec le plus de votes doivent être prioritaires. Assure-toi de maintenir la cohérence avec les modules existants.`;

    return prompt;
  };

  const prompt = generatePrompt();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Prompt copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Exporter pour IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prompt Roadmap pour IA
          </DialogTitle>
          <DialogDescription>
            Copiez ce prompt pour donner le contexte complet de la roadmap à une IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={prompt}
            readOnly
            className="min-h-[400px] font-mono text-xs"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier le prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
