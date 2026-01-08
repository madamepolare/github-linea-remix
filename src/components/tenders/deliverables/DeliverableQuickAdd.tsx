import { useState } from "react";
import { Check, Plus, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddItem {
  type: string;
  name: string;
  responsibleType: string;
  category: "candidature" | "offre";
}

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  // Candidature
  { type: "dc1", name: "DC1", responsibleType: "mandataire", category: "candidature" },
  { type: "dc2", name: "DC2", responsibleType: "tous", category: "candidature" },
  { type: "dc4", name: "DC4", responsibleType: "tous", category: "candidature" },
  { type: "urssaf", name: "URSSAF", responsibleType: "tous", category: "candidature" },
  { type: "kbis", name: "Kbis", responsibleType: "tous", category: "candidature" },
  { type: "attestation_fiscale", name: "Attestation fiscale", responsibleType: "tous", category: "candidature" },
  { type: "attestation_assurance", name: "Assurance RCP", responsibleType: "tous", category: "candidature" },
  { type: "references", name: "Références", responsibleType: "tous", category: "candidature" },
  { type: "cv", name: "CV équipe", responsibleType: "tous", category: "candidature" },
  { type: "habilitations", name: "Habilitations", responsibleType: "tous", category: "candidature" },
  // Offre
  { type: "acte_engagement", name: "Acte d'engagement", responsibleType: "mandataire", category: "offre" },
  { type: "memoire_technique", name: "Mémoire technique", responsibleType: "tous", category: "offre" },
  { type: "dpgf", name: "DPGF", responsibleType: "mandataire", category: "offre" },
  { type: "bpu", name: "BPU", responsibleType: "mandataire", category: "offre" },
  { type: "planning", name: "Planning", responsibleType: "mandataire", category: "offre" },
  { type: "pieces_graphiques", name: "Pièces graphiques", responsibleType: "mandataire", category: "offre" },
  { type: "note_methodologique", name: "Note méthodologique", responsibleType: "mandataire", category: "offre" },
];

interface DeliverableQuickAddProps {
  existingTypes: string[];
  onAdd: (item: { deliverable_type: string; name: string; responsible_type: string }) => void;
  isLoading?: boolean;
}

export function DeliverableQuickAdd({ existingTypes, onAdd, isLoading }: DeliverableQuickAddProps) {
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  const handleAdd = (item: QuickAddItem) => {
    onAdd({
      deliverable_type: item.type,
      name: item.name,
      responsible_type: item.responsibleType,
    });
    
    setRecentlyAdded(prev => [...prev, item.type]);
    setTimeout(() => {
      setRecentlyAdded(prev => prev.filter(t => t !== item.type));
    }, 1500);
  };

  const candidatureItems = QUICK_ADD_ITEMS.filter(i => i.category === "candidature");
  const offreItems = QUICK_ADD_ITEMS.filter(i => i.category === "offre");

  const renderButton = (item: QuickAddItem) => {
    const isAdded = existingTypes.includes(item.type);
    const isJustAdded = recentlyAdded.includes(item.type);

    return (
      <motion.div
        key={item.type}
        initial={false}
        animate={isJustAdded ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant={isAdded ? "secondary" : "outline"}
          size="sm"
          disabled={isAdded || isLoading}
          onClick={() => handleAdd(item)}
          className={cn(
            "h-8 text-xs font-medium transition-all",
            isAdded && "opacity-60",
            isJustAdded && "bg-green-100 dark:bg-green-900/30 border-green-500"
          )}
        >
          <AnimatePresence mode="wait">
            {isJustAdded ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="mr-1"
              >
                <Check className="h-3 w-3 text-green-600" />
              </motion.span>
            ) : isAdded ? (
              <Check className="h-3 w-3 mr-1 text-muted-foreground" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
          </AnimatePresence>
          {item.name}
        </Button>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajout rapide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Candidature */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Candidature
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {candidatureItems.map(renderButton)}
          </div>
        </div>

        {/* Offre */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Offre
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {offreItems.map(renderButton)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
