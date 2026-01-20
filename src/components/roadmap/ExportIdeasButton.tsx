import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
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
import { RoadmapFeedback } from "@/hooks/useRoadmapFeedback";

interface ExportIdeasButtonProps {
  ideas: RoadmapIdea[];
  roadmapItems: RoadmapItem[];
  allFeedbacks?: RoadmapFeedback[];
}

export function ExportIdeasButton({ ideas, roadmapItems, allFeedbacks = [] }: ExportIdeasButtonProps) {
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    const inProgress = roadmapItems.filter(i => i.status === 'in_progress');
    const planned = roadmapItems.filter(i => i.status === 'planned');
    const vision = roadmapItems.filter(i => i.status === 'vision');
    const delivered = roadmapItems.filter(i => i.status === 'delivered');
    const pendingIdeas = ideas.filter(i => i.status === 'pending' || i.status === 'approved');

    // Separate roadmap feedbacks from feedback mode entries
    const roadmapFeedbacks = allFeedbacks.filter(fb => fb.source === 'roadmap');
    const feedbackModeEntries = allFeedbacks.filter(fb => fb.source === 'feedback_mode');

    // Group roadmap feedbacks by item
    const feedbacksByItem = new Map<string | null, RoadmapFeedback[]>();
    roadmapFeedbacks.forEach(fb => {
      const key = fb.roadmap_item_id;
      if (!feedbacksByItem.has(key)) {
        feedbacksByItem.set(key, []);
      }
      feedbacksByItem.get(key)!.push(fb);
    });

    // Group feedback mode entries by route
    const feedbacksByRoute = new Map<string, RoadmapFeedback[]>();
    feedbackModeEntries.forEach(fb => {
      const route = fb.route_path || '/unknown';
      if (!feedbacksByRoute.has(route)) {
        feedbacksByRoute.set(route, []);
      }
      feedbacksByRoute.get(route)!.push(fb);
    });

    let prompt = `# État actuel de la Roadmap Linea

## Modules En Cours de Développement (${inProgress.length})
${inProgress.length > 0 ? inProgress.map(i => {
  const feedbacks = feedbacksByItem.get(i.id) || [];
  let text = `### ${i.title}
${i.description || 'N/A'}`;
  if (feedbacks.length > 0) {
    text += `\n\n**Retours utilisateurs (${feedbacks.length}):**`;
    feedbacks.forEach(fb => {
      text += `\n- "${fb.content}" - ${fb.author?.full_name || 'Utilisateur anonyme'}`;
    });
  }
  return text;
}).join('\n\n') : 'Aucun'}

## Planifié (${planned.length})
${planned.length > 0 ? planned.map(i => `- **${i.title}**: ${i.description || 'N/A'} ${i.quarter ? `(${i.quarter})` : ''}`).join('\n') : 'Aucun'}

## Vision Long Terme (${vision.length})
${vision.length > 0 ? vision.map(i => `- **${i.title}**: ${i.description || 'N/A'}`).join('\n') : 'Aucun'}

## Déjà Livré (${delivered.length})
${delivered.length > 0 ? delivered.map(i => `- ${i.title}`).join('\n') : 'Aucun'}

## Idées Utilisateurs en Attente (${pendingIdeas.length})
${pendingIdeas.length > 0 
  ? pendingIdeas.map(i => `- **${i.title}** (${i.votes_count} votes): ${i.description || 'N/A'} [Catégorie: ${i.category}]`).join('\n') 
  : 'Aucune idée en attente'}

---

## Retours du Mode Feedback (par page)

${feedbackModeEntries.length > 0 ? 
  Array.from(feedbacksByRoute.entries()).map(([route, fbs]) => {
    return `### ${route} (${fbs.length} retour${fbs.length > 1 ? 's' : ''})
${fbs.map(fb => `- [${fb.feedback_type || 'suggestion'}] "${fb.content}" - ${fb.author?.full_name || 'Anonyme'}`).join('\n')}`;
  }).join('\n\n')
  : 'Aucun retour du mode feedback'}

---

## Résumé Global

- **Retours Roadmap:** ${roadmapFeedbacks.length}
- **Retours Mode Feedback:** ${feedbackModeEntries.length}
- **Total:** ${allFeedbacks.length} retour(s)

---

## Instructions pour l'IA

Utilise cette roadmap et les retours utilisateurs pour:
1. Comprendre l'état actuel des fonctionnalités de l'application
2. Prendre en compte les retours utilisateurs pour chaque module
3. Analyser les retours du mode feedback regroupés par page/route
4. Prioriser les améliorations en fonction des votes et des retours
5. Identifier les points de friction mentionnés par les utilisateurs
6. Proposer des solutions concrètes pour les problèmes soulevés

Les retours avec le plus de récurrence doivent être prioritaires. Assure-toi de maintenir la cohérence avec les modules existants.`;

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
            Copiez ce prompt pour donner le contexte complet de la roadmap et des retours utilisateurs à votre GPT
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
